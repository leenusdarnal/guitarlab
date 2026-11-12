import { describe, expect, it } from 'vitest';
import {
  createChordTransitionObservation,
  getCleanChangeRate,
  OPEN_CHORDS
} from './chords';

describe('open chord definitions', () => {
  it('defines six unique strings for every open chord shape', () => {
    expect(OPEN_CHORDS).toHaveLength(5);
    for (const chord of OPEN_CHORDS) {
      expect(chord.strings).toHaveLength(6);
      expect(new Set(chord.strings.map((string) => string.stringNumber)).size).toBe(6);
    }
  });

  it('distinguishes muted, open and fretted strings', () => {
    const cMajor = OPEN_CHORDS.find((chord) => chord.id === 'c-major');
    expect(cMajor?.strings[0].state).toBe('muted');
    expect(cMajor?.strings[3].state).toBe('open');
    expect(cMajor?.strings[1].state).toBe('fretted');
  });
});

describe('chord transition evidence', () => {
  it('keeps clean changes separate from elapsed time', () => {
    const observation = createChordTransitionObservation({
      cleanChanges: 7,
      totalAttempts: 10,
      elapsedSeconds: 22
    });
    expect(getCleanChangeRate(observation)).toBe(70);
    expect(observation.elapsedSeconds).toBe(22);
    expect(observation.cleanChanges).toBe(7);
  });

  it('returns no rate for an empty set of attempts', () => {
    const observation = createChordTransitionObservation({
      cleanChanges: 0,
      totalAttempts: 0,
      elapsedSeconds: 0
    });
    expect(getCleanChangeRate(observation)).toBeNull();
  });

  it('rejects more clean changes than total attempts', () => {
    expect(() =>
      createChordTransitionObservation({
        cleanChanges: 4,
        totalAttempts: 3,
        elapsedSeconds: 12
      })
    ).toThrow();
  });
});
