export type PitchEstimate =
  | {
      status: 'detected';
      frequencyHz: number;
      confidence: number;
      rms: number;
    }
  | {
      status: 'silence' | 'uncertain' | 'insufficient-data';
      confidence: number;
      rms: number;
    };

export interface PitchEstimatorOptions {
  minFrequencyHz?: number;
  maxFrequencyHz?: number;
  minRms?: number;
  minConfidence?: number;
  clarityThreshold?: number;
}

const DEFAULT_OPTIONS = {
  minFrequencyHz: 70,
  maxFrequencyHz: 1_000,
  minRms: 0.008,
  minConfidence: 0.8,
  clarityThreshold: 0.15
} as const;

/**
 * Estimate the strongest stable single-note fundamental in a PCM sample window.
 *
 * This is a pure YIN-style estimator: it accepts samples and a sample rate,
 * performs no browser or microphone access, and never retains the input.
 * Callers should run it on short, recent windows rather than every animation
 * frame. Polyphonic recognition is intentionally out of scope.
 */
export function estimatePitch(
  samples: Float32Array,
  sampleRate: number,
  options: PitchEstimatorOptions = {}
): PitchEstimate {
  const config = { ...DEFAULT_OPTIONS, ...options };
  validateOptions(config, sampleRate);

  if (samples.length < 32) {
    return { status: 'insufficient-data', confidence: 0, rms: 0 };
  }

  // Remove DC offset before measuring level or periodicity.
  let mean = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) {
      return { status: 'uncertain', confidence: 0, rms: 0 };
    }
    mean += sample;
  }
  mean /= samples.length;

  let squaredLevel = 0;
  for (const sample of samples) {
    const centered = sample - mean;
    squaredLevel += centered * centered;
  }
  const rms = Math.sqrt(squaredLevel / samples.length);

  const minLag = Math.max(2, Math.floor(sampleRate / config.maxFrequencyHz));
  const requestedMaxLag = Math.ceil(sampleRate / config.minFrequencyHz);
  // At least two complete comparisons must remain for every candidate lag.
  const maxLag = Math.min(requestedMaxLag, Math.floor(samples.length / 2));
  if (maxLag <= minLag + 1) {
    return { status: 'insufficient-data', confidence: 0, rms };
  }

  if (rms < config.minRms) {
    return { status: 'silence', confidence: 0, rms };
  }

  const difference = new Float64Array(maxLag + 1);
  const comparisonLength = samples.length - maxLag;
  for (let lag = 1; lag <= maxLag; lag += 1) {
    let sum = 0;
    for (let index = 0; index < comparisonLength; index += 1) {
      const left = samples[index] - mean;
      const right = samples[index + lag] - mean;
      const delta = left - right;
      sum += delta * delta;
    }
    difference[lag] = sum;
  }

  // Cumulative mean normalized difference function (YIN).
  const normalized = new Float64Array(maxLag + 1);
  let cumulative = 0;
  for (let lag = 1; lag <= maxLag; lag += 1) {
    cumulative += difference[lag];
    normalized[lag] =
      cumulative === 0 ? 1 : (difference[lag] * lag) / cumulative;
  }

  let selectedLag = -1;
  for (let lag = minLag; lag < maxLag; lag += 1) {
    if (
      normalized[lag] < config.clarityThreshold &&
      normalized[lag] <= normalized[lag + 1]
    ) {
      selectedLag = lag;
      break;
    }
  }

  // Keep the best candidate for a useful "uncertain" result when no trough
  // reaches the clarity threshold; do not turn noise into a confident note.
  if (selectedLag === -1) {
    let bestValue = Number.POSITIVE_INFINITY;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      if (normalized[lag] < bestValue) {
        bestValue = normalized[lag];
        selectedLag = lag;
      }
    }
  }

  const confidence = clamp(1 - normalized[selectedLag], 0, 1);
  if (confidence < config.minConfidence) {
    return { status: 'uncertain', confidence, rms };
  }

  const left = normalized[Math.max(1, selectedLag - 1)];
  const center = normalized[selectedLag];
  const right = normalized[Math.min(maxLag, selectedLag + 1)];
  const curvature = left - 2 * center + right;
  const adjustment =
    Math.abs(curvature) < 1e-12
      ? 0
      : clamp((0.5 * (left - right)) / curvature, -1, 1);
  const period = selectedLag + adjustment;
  const frequencyHz = sampleRate / period;

  if (
    !Number.isFinite(frequencyHz) ||
    frequencyHz < config.minFrequencyHz ||
    frequencyHz > config.maxFrequencyHz
  ) {
    return { status: 'uncertain', confidence, rms };
  }

  return {
    status: 'detected',
    frequencyHz,
    confidence,
    rms
  };
}

function validateOptions(
  options: Required<PitchEstimatorOptions>,
  sampleRate: number
): void {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new RangeError('Sample rate must be a positive finite number.');
  }
  if (
    !Number.isFinite(options.minFrequencyHz) ||
    !Number.isFinite(options.maxFrequencyHz) ||
    options.minFrequencyHz <= 0 ||
    options.maxFrequencyHz <= options.minFrequencyHz ||
    options.maxFrequencyHz >= sampleRate / 2
  ) {
    throw new RangeError(
      'Pitch frequency bounds must be valid and below Nyquist.'
    );
  }
  if (!Number.isFinite(options.minRms) || options.minRms < 0) {
    throw new RangeError('Minimum RMS must be a finite non-negative number.');
  }
  if (
    !Number.isFinite(options.minConfidence) ||
    options.minConfidence < 0 ||
    options.minConfidence > 1
  ) {
    throw new RangeError('Minimum confidence must be between 0 and 1.');
  }
  if (
    !Number.isFinite(options.clarityThreshold) ||
    options.clarityThreshold <= 0 ||
    options.clarityThreshold >= 1
  ) {
    throw new RangeError('Clarity threshold must be between 0 and 1.');
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
