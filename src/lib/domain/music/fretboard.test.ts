import { describe, expect, it } from 'vitest';
import {
  FLAT_NOTE_NAMES,
  STANDARD_GUITAR_TUNING,
  findFretboardPositions,
  getDisplayFretColumn,
  getFretboardLayout,
  getNoteAtPosition,
  midiToFrequency
} from './fretboard';

describe('standard guitar fretboard', () => {
  it('uses standard E–A–D–G–B–E open-string pitches', () => {
    const expected = [
      [6, 40, 'E', 2],
      [5, 45, 'A', 2],
      [4, 50, 'D', 3],
      [3, 55, 'G', 3],
      [2, 59, 'B', 3],
      [1, 64, 'E', 4]
    ];

    for (const [stringNumber, midi, noteName, octave] of expected) {
      const note = getNoteAtPosition(stringNumber, 0);
      expect(note).toMatchObject({ stringNumber, fret: 0, midi, noteName, octave });
    }
  });

  it('raises every open string by one octave at fret twelve', () => {
    for (const string of STANDARD_GUITAR_TUNING.strings) {
      const open = getNoteAtPosition(string.stringNumber, 0);
      const octave = getNoteAtPosition(string.stringNumber, 12);
      expect(octave.midi).toBe(open.midi + 12);
      expect(octave.pitchClass).toBe(open.pitchClass);
      expect(octave.octave).toBe(open.octave + 1);
    }
  });

  it('supports sharp and flat note spelling without changing pitch', () => {
    const sharp = getNoteAtPosition(6, 1, STANDARD_GUITAR_TUNING, 'sharp');
    const flat = getNoteAtPosition(6, 1, STANDARD_GUITAR_TUNING, 'flat');

    expect(sharp.noteName).toBe('F');
    expect(flat.noteName).toBe(FLAT_NOTE_NAMES[5]);
    expect(flat.midi).toBe(sharp.midi);
    expect(getNoteAtPosition(6, 2).noteName).toBe('F♯');
    expect(getNoteAtPosition(6, 2, STANDARD_GUITAR_TUNING, 'flat').noteName).toBe('G♭');
  });

  it('calculates concert A4 at 440 Hz', () => {
    expect(getNoteAtPosition(1, 5)).toMatchObject({
      midi: 69,
      noteName: 'A',
      octave: 4
    });
    expect(midiToFrequency(69)).toBeCloseTo(440, 8);
  });

  it('returns six rows from high E to low E and thirteen frets by default', () => {
    const layout = getFretboardLayout();

    expect(layout).toHaveLength(6);
    expect(layout[0]).toHaveLength(13);
    expect(layout[0][0]).toMatchObject({ stringNumber: 1, noteName: 'E' });
    expect(layout[5][0]).toMatchObject({ stringNumber: 6, noteName: 'E' });
  });

  it('finds every position for a pitch class without changing string identity', () => {
    const positions = findFretboardPositions(0, 12);

    expect(positions.length).toBeGreaterThan(0);
    expect(positions.every((position) => position.pitchClass === 0)).toBe(true);
    expect(positions.some((position) => position.stringNumber === 6 && position.fret === 8)).toBe(true);
    expect(positions.some((position) => position.stringNumber === 1 && position.fret === 8)).toBe(true);
  });

  it('mirrors only the display column for left-handed presentation', () => {
    expect(getDisplayFretColumn(0, 12, 'right')).toBe(1);
    expect(getDisplayFretColumn(12, 12, 'right')).toBe(13);
    expect(getDisplayFretColumn(0, 12, 'left')).toBe(13);
    expect(getDisplayFretColumn(12, 12, 'left')).toBe(1);

    const note = getNoteAtPosition(6, 3);
    expect(note).toMatchObject({ stringNumber: 6, fret: 3, noteName: 'G' });
  });

  it('rejects invalid strings, frets, pitch classes and tunings', () => {
    expect(() => getNoteAtPosition(7, 0)).toThrow(RangeError);
    expect(() => getNoteAtPosition(1, -1)).toThrow(RangeError);
    expect(() => getNoteAtPosition(1, 25)).toThrow(RangeError);
    expect(() => getFretboardLayout(25)).toThrow(RangeError);
    expect(() => findFretboardPositions(12)).toThrow(RangeError);
    expect(() =>
      getFretboardLayout(12, {
        ...STANDARD_GUITAR_TUNING,
        strings: [
          ...STANDARD_GUITAR_TUNING.strings.slice(0, 5),
          { stringNumber: 6, openMidi: 64 }
        ]
      })
    ).toThrow(RangeError);
  });
});
