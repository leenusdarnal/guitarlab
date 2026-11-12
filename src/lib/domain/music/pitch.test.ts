import { describe, expect, it } from 'vitest';
import {
  getFretboardRows,
  getNoteAtFret,
  isEnharmonicMatch,
  STANDARD_TUNING
} from './pitch';

describe('standard guitar pitch calculations', () => {
  it('maps open strings to E2 A2 D3 G3 B3 E4', () => {
    const openNotes = STANDARD_TUNING.map((string) => getNoteAtFret(string, 0));
    expect(openNotes.map((note) => [note.name, note.octave])).toEqual([
      ['E', 2],
      ['A', 2],
      ['D', 3],
      ['G', 3],
      ['B', 3],
      ['E', 4]
    ]);
  });

  it('calculates the 12th fret as one octave above the open string', () => {
    const lowE = getNoteAtFret(STANDARD_TUNING[0], 12);
    expect(lowE.midi).toBe(52);
    expect(lowE.name).toBe('E');
    expect(lowE.octave).toBe(3);
    expect(lowE.frequencyHz).toBeCloseTo(164.8138, 3);
  });

  it('wraps note names across the octave correctly', () => {
    const note = getNoteAtFret(STANDARD_TUNING[1], 3);
    expect(note.name).toBe('C');
    expect(note.octave).toBe(3);
  });

  it('mirrors the display order for left-handed presentation without changing pitch identity', () => {
    const right = getFretboardRows({ handedness: 'right', fretCount: 1 });
    const left = getFretboardRows({ handedness: 'left', fretCount: 1 });

    expect(right.map((row) => row.string.stringNumber)).toEqual([6, 5, 4, 3, 2, 1]);
    expect(left.map((row) => row.string.stringNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(left[0].notes[0].midi).toBe(64);
    expect(left[5].notes[0].midi).toBe(40);
  });

  it('matches the selected pitch class', () => {
    const c = getNoteAtFret(STANDARD_TUNING[1], 3);
    expect(isEnharmonicMatch(c, 'C')).toBe(true);
    expect(isEnharmonicMatch(c, 'D')).toBe(false);
  });

  it('rejects invalid fret values', () => {
    expect(() => getNoteAtFret(STANDARD_TUNING[0], -1)).toThrow(RangeError);
    expect(() => getNoteAtFret(STANDARD_TUNING[0], 25)).toThrow(RangeError);
    expect(() => getNoteAtFret(STANDARD_TUNING[0], 1.5)).toThrow(RangeError);
  });
});
