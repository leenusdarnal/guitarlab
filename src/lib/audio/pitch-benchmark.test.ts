import { describe, expect, it } from 'vitest';
import { estimatePitch } from './pitch-estimator';
import { StableNoteTracker } from './stable-note-tracker';
import {
  createSyntheticPitchCases,
  runSyntheticPitchBenchmark
} from './pitch-benchmark';

describe('synthetic pitch benchmark', () => {
  it('covers standard guitar notes and deterministic stress fixtures', () => {
    const first = createSyntheticPitchCases();
    const second = createSyntheticPitchCases();

    expect(first.map((fixture) => fixture.id)).toEqual([
      'low-e2',
      'a2',
      'd3',
      'g3',
      'b3',
      'high-e4',
      'harmonic-rich-a2',
      'decaying-pluck-g3',
      'digital-silence'
    ]);
    expect(Array.from(first[7].samples)).toEqual(Array.from(second[7].samples));
  });

  it('meets per-fixture frequency error budgets', () => {
    const report = runSyntheticPitchBenchmark();

    expect(report.total).toBe(9);
    expect(report.passed).toBe(report.total);
    expect(report.detected).toBe(8);
    for (const result of report.results) {
      if (result.expectedFrequencyHz === null) {
        expect(result.estimate.status).toBe('silence');
      } else {
        expect(result.estimate.status).toBe('detected');
        expect(result.errorCents).not.toBeNull();
        const budget =
          result.id === 'decaying-pluck-g3'
            ? 35
            : result.id === 'harmonic-rich-a2'
              ? 20
              : 15;
        expect(Math.abs(result.errorCents ?? Infinity)).toBeLessThanOrEqual(
          budget
        );
      }
    }
  });

  it('emits exactly one note-on for a sustained synthetic note', () => {
    const tracker = new StableNoteTracker();
    const estimate = {
      status: 'detected' as const,
      frequencyHz: 196,
      confidence: 0.96,
      rms: 0.2
    };
    const events = Array.from(
      { length: 20 },
      (_, frame) => tracker.update(estimate, frame * 30).event
    );

    expect(events.filter((event) => event === 'note-on')).toHaveLength(1);
    expect(events.filter((event) => event === 'note-change')).toHaveLength(0);
    expect(events.filter((event) => event === 'note-off')).toHaveLength(0);
  });

  it('tracks overlapping PCM windows end-to-end without duplicate note events', () => {
    const sampleRate = 48_000;
    const frequencyHz = 196;
    const windowSize = 4_096;
    const hopSize = 1_024;
    const samples = Float32Array.from(
      { length: 16_384 },
      (_, index) =>
        0.4 * Math.sin((2 * Math.PI * frequencyHz * index) / sampleRate)
    );
    const tracker = new StableNoteTracker();
    const events: Array<'note-on' | 'note-change' | 'note-off' | null> = [];

    for (
      let offset = 0;
      offset + windowSize <= samples.length;
      offset += hopSize
    ) {
      const estimate = estimatePitch(
        samples.subarray(offset, offset + windowSize),
        sampleRate
      );
      events.push(
        tracker.update(estimate, (offset / sampleRate) * 1_000).event
      );
    }

    expect(events.filter((event) => event === 'note-on')).toHaveLength(1);
    expect(events.filter((event) => event === 'note-change')).toHaveLength(0);
    expect(events.filter((event) => event === 'note-off')).toHaveLength(0);
  });

  it('validates benchmark input dimensions', () => {
    expect(() => createSyntheticPitchCases(0)).toThrow(RangeError);
    expect(() => createSyntheticPitchCases(48_000, 16)).toThrow(RangeError);
  });
});
