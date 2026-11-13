import { describe, expect, it } from 'vitest';
import { estimatePitch } from './pitch-estimator';

const SAMPLE_RATE = 48_000;
const WINDOW_SIZE = 4_096;

function makeTone(
  frequencyHz: number,
  amplitude = 0.6,
  sampleRate = SAMPLE_RATE,
  length = WINDOW_SIZE
): Float32Array {
  return Float32Array.from(
    { length },
    (_, index) =>
      amplitude * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate)
  );
}

describe('estimatePitch', () => {
  it.each([82.41, 110, 196, 329.63, 440, 880])(
    'estimates a %s Hz sine wave within a small tolerance',
    (frequencyHz) => {
      const result = estimatePitch(makeTone(frequencyHz), SAMPLE_RATE);

      expect(result.status).toBe('detected');
      if (result.status !== 'detected') return;
      expect(result.frequencyHz).toBeCloseTo(frequencyHz, 0);
      expect(result.confidence).toBeGreaterThanOrEqual(0.8);
      expect(result.rms).toBeGreaterThan(0.3);
    }
  );

  it('estimates the fundamental of a guitar-like harmonic signal', () => {
    const fundamental = 110;
    const samples = makeTone(fundamental).map((_, index) => {
      const time = index / SAMPLE_RATE;
      return (
        0.45 * Math.sin(2 * Math.PI * fundamental * time) +
        0.2 * Math.sin(2 * Math.PI * fundamental * 2 * time) +
        0.1 * Math.sin(2 * Math.PI * fundamental * 3 * time)
      );
    });

    const result = estimatePitch(samples, SAMPLE_RATE);
    expect(result.status).toBe('detected');
    if (result.status !== 'detected') return;
    expect(result.frequencyHz).toBeCloseTo(fundamental, 0);
  });

  it('rejects silence rather than reporting a note', () => {
    const result = estimatePitch(new Float32Array(WINDOW_SIZE), SAMPLE_RATE);

    expect(result.status).toBe('silence');
    expect(result.confidence).toBe(0);
  });

  it('treats deterministic broadband noise as uncertain', () => {
    const samples = Float32Array.from(
      { length: WINDOW_SIZE },
      (_, index) => {
        const value = Math.sin(index * 12.9898) * 43_758.5453;
        return ((value - Math.floor(value)) * 2 - 1) * 0.3;
      }
    );

    expect(estimatePitch(samples, SAMPLE_RATE).status).toBe('uncertain');
  });

  it('rejects a buffer that is too short for the requested range', () => {
    expect(estimatePitch(new Float32Array(32), SAMPLE_RATE).status).toBe(
      'insufficient-data'
    );
  });

  it('rejects non-finite samples without exposing a frequency', () => {
    const samples = makeTone(440);
    samples[100] = Number.NaN;

    expect(estimatePitch(samples).status).toBe('uncertain');
  });

  it('supports a lower guitar-frequency bound when the window is long enough', () => {
    const result = estimatePitch(makeTone(55, 0.6, SAMPLE_RATE, 8_192), SAMPLE_RATE, {
      minFrequencyHz: 40
    });

    expect(result.status).toBe('detected');
    if (result.status !== 'detected') return;
    expect(result.frequencyHz).toBeCloseTo(55, 0);
  });

  it('validates sample rate and estimator thresholds', () => {
    const samples = makeTone(440);

    expect(() => estimatePitch(samples, 0)).toThrow(RangeError);
    expect(() =>
      estimatePitch(samples, SAMPLE_RATE, { minConfidence: 1.1 })
    ).toThrow(RangeError);
    expect(() =>
      estimatePitch(samples, SAMPLE_RATE, { minFrequencyHz: 1_000 })
    ).toThrow(RangeError);
  });
});
