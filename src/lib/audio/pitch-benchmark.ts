import { estimatePitch, type PitchEstimate } from './pitch-estimator';

export interface SyntheticPitchCase {
  id: string;
  expectedFrequencyHz: number | null;
  maxErrorCents: number;
  samples: Float32Array;
}

export interface PitchBenchmarkResult {
  id: string;
  expectedFrequencyHz: number | null;
  estimate: PitchEstimate;
  errorCents: number | null;
  passed: boolean;
}

export interface PitchBenchmarkReport {
  total: number;
  passed: number;
  detected: number;
  results: PitchBenchmarkResult[];
}

const DEFAULT_SAMPLE_RATE = 48_000;
const DEFAULT_WINDOW_SIZE = 4_096;

/** Generate repeatable in-memory fixtures; these are not real-guitar recordings. */
export function createSyntheticPitchCases(
  sampleRate = DEFAULT_SAMPLE_RATE,
  windowSize = DEFAULT_WINDOW_SIZE
): SyntheticPitchCase[] {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new RangeError('Sample rate must be a positive finite number.');
  }
  if (!Number.isInteger(windowSize) || windowSize < 32) {
    throw new RangeError('Window size must be an integer of at least 32.');
  }

  const notes = [
    ['low-e2', 82.4069],
    ['a2', 110],
    ['d3', 146.832],
    ['g3', 196],
    ['b3', 246.942],
    ['high-e4', 329.628]
  ] as const;
  const cases: SyntheticPitchCase[] = notes.map(([id, frequency]) => ({
    id,
    expectedFrequencyHz: frequency,
    maxErrorCents: 15,
    samples: sine(frequency, sampleRate, windowSize, 0.55)
  }));

  cases.push({
    id: 'harmonic-rich-a2',
    expectedFrequencyHz: 110,
    maxErrorCents: 20,
    samples: Float32Array.from({ length: windowSize }, (_, index) => {
      const phase = (2 * Math.PI * 110 * index) / sampleRate;
      return (
        0.45 * Math.sin(phase) +
        0.22 * Math.sin(2 * phase) +
        0.1 * Math.sin(3 * phase) +
        0.04 * Math.sin(4 * phase)
      );
    })
  });

  let seed = 0x6d2b79f5;
  cases.push({
    id: 'decaying-pluck-g3',
    expectedFrequencyHz: 196,
    maxErrorCents: 35,
    samples: Float32Array.from({ length: windowSize }, (_, index) => {
      const time = index / sampleRate;
      const envelope = Math.exp(-time * 5) * (1 - Math.exp(-time * 90));
      const phase = 2 * Math.PI * 196 * time;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const noise = (seed / 0xffffffff) * 2 - 1;
      const string =
        Math.sin(phase) +
        0.28 * Math.sin(2 * phase) +
        0.12 * Math.sin(3 * phase);
      return 0.48 * envelope * string + 0.0015 * noise;
    })
  });
  cases.push({
    id: 'digital-silence',
    expectedFrequencyHz: null,
    maxErrorCents: 0,
    samples: new Float32Array(windowSize)
  });
  return cases;
}

/** Evaluate all fixtures and return error metrics without logging sample data. */
export function runSyntheticPitchBenchmark(
  sampleRate = DEFAULT_SAMPLE_RATE,
  windowSize = DEFAULT_WINDOW_SIZE
): PitchBenchmarkReport {
  const results = createSyntheticPitchCases(sampleRate, windowSize).map(
    (fixture): PitchBenchmarkResult => {
      const estimate = estimatePitch(fixture.samples, sampleRate);
      if (fixture.expectedFrequencyHz === null) {
        return {
          id: fixture.id,
          expectedFrequencyHz: null,
          estimate,
          errorCents: null,
          passed: estimate.status === 'silence'
        };
      }
      if (estimate.status !== 'detected') {
        return {
          id: fixture.id,
          expectedFrequencyHz: fixture.expectedFrequencyHz,
          estimate,
          errorCents: null,
          passed: false
        };
      }
      const errorCents =
        1200 * Math.log2(estimate.frequencyHz / fixture.expectedFrequencyHz);
      return {
        id: fixture.id,
        expectedFrequencyHz: fixture.expectedFrequencyHz,
        estimate,
        errorCents,
        passed: Math.abs(errorCents) <= fixture.maxErrorCents
      };
    }
  );
  return {
    total: results.length,
    passed: results.filter((result) => result.passed).length,
    detected: results.filter((result) => result.estimate.status === 'detected')
      .length,
    results
  };
}

function sine(
  frequencyHz: number,
  sampleRate: number,
  length: number,
  amplitude: number
): Float32Array {
  return Float32Array.from(
    { length },
    (_, index) =>
      amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate)
  );
}
