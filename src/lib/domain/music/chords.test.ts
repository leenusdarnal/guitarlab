import { describe, expect, it } from 'vitest';
import {
  chordDefinitionSchema,
  chordStringSchema,
  createChordTransitionObservation,
  getCleanChangeRate,
  OPEN_CHORDS
} from './chords';

describe('open chord definitions', () => {
  it('defines all six guitar strings exactly once for every open chord', () => {
    expect(OPEN_CHORDS).toHaveLength(5);
    for (const chord of OPEN_CHORDS) {
      expect(chordDefinitionSchema.safeParse(chord).success).toBe(true);
      expect(chord.strings).toHaveLength(6);
      expect(chord.strings.map((string) => string.stringNumber).sort()).toEqual(
        [1, 2, 3, 4, 5, 6]
      );
    }
  });

  it('distinguishes muted, open and fretted strings', () => {
    const cMajor = OPEN_CHORDS.find((chord) => chord.id === 'c-major');
    expect(cMajor?.strings[0].state).toBe('muted');
    expect(cMajor?.strings[3].state).toBe('open');
    expect(cMajor?.strings[1].state).toBe('fretted');
  });

  it('rejects out-of-range string numbers and invalid finger assignments', () => {
    expect(
      chordStringSchema.safeParse({
        stringNumber: 7,
        state: 'muted',
        fret: null,
        finger: null
      }).success
    ).toBe(false);
    expect(
      chordStringSchema.safeParse({
        stringNumber: 2,
        state: 'fretted',
        fret: 3,
        finger: 5
      }).success
    ).toBe(false);
  });

  it('rejects a chord with duplicated or missing string numbers', () => {
    const chord = OPEN_CHORDS[0];
    const invalid = {
      ...chord,
      strings: chord.strings.map((string, index) =>
        index === 5 ? { ...string, stringNumber: 2 } : string
      )
    };
    expect(chordDefinitionSchema.safeParse(invalid).success).toBe(false);
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
