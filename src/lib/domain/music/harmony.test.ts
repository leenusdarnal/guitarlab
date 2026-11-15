import { describe, expect, it } from 'vitest';
import {
  getCagedShapePositions,
  getFretboardPositionsForPitchClasses,
  getHarmonyPitchClassNames,
  getMajorScalePitchClasses,
  getTriadPitchClasses,
  getTriadInversionPositions
} from './harmony';

describe('shared guitar harmony and fretboard model', () => {
  it('derives major scales from a chromatic root', () => {
    expect(getMajorScalePitchClasses(0)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    expect(getHarmonyPitchClassNames(getMajorScalePitchClasses(0))).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B'
    ]);
    expect(getMajorScalePitchClasses(2)).toEqual([2, 4, 6, 7, 9, 11, 1]);
  });

  it('derives major/minor triads and both inversions', () => {
    expect(getTriadPitchClasses(0, 'major', 'root')).toEqual([0, 4, 7]);
    expect(getTriadPitchClasses(0, 'major', 'first')).toEqual([4, 7, 0]);
    expect(getTriadPitchClasses(0, 'major', 'second')).toEqual([7, 0, 4]);
    expect(getTriadPitchClasses(9, 'minor', 'root')).toEqual([9, 0, 4]);
  });

  it('maps each C-major inversion to a distinct playable bass-to-treble voicing', () => {
    expect(
      getTriadInversionPositions(0, 'root').map((note) => note.pitchClass)
    ).toEqual([0, 4, 7]);
    expect(
      getTriadInversionPositions(0, 'first').map((note) => note.pitchClass)
    ).toEqual([4, 7, 0]);
    expect(
      getTriadInversionPositions(0, 'second').map((note) => note.pitchClass)
    ).toEqual([7, 0, 4]);
    expect(
      getTriadInversionPositions(2, 'first').map((note) => note.pitchClass)
    ).toEqual([6, 9, 2]);
  });

  it('maps scale and triad pitch classes through canonical fretboard notes', () => {
    const scale = getFretboardPositionsForPitchClasses(
      getMajorScalePitchClasses(0),
      12
    );
    const triad = getFretboardPositionsForPitchClasses(
      getTriadPitchClasses(0),
      12
    );
    expect(scale.length).toBeGreaterThan(triad.length);
    expect(
      scale.every((note) => [0, 2, 4, 5, 7, 9, 11].includes(note.pitchClass))
    ).toBe(true);
    expect(triad.every((note) => [0, 4, 7].includes(note.pitchClass))).toBe(
      true
    );
    expect(
      triad.some((note) => note.stringNumber === 5 && note.fret === 3)
    ).toBe(true);
  });

  it('defines five chord-tone-correct CAGED C-major forms', () => {
    const shapes = getCagedShapePositions(0);
    expect(shapes.map((shape) => shape.shape)).toEqual([
      'C',
      'A',
      'G',
      'E',
      'D'
    ]);
    expect(shapes.map((shape) => shape.fretLabel)).toEqual([
      'x32010',
      'x35553',
      '875558',
      '81010988',
      'xx10121312'
    ]);
    for (const shape of shapes) {
      const notes = shape.notes.filter((note) => note !== null);
      expect(notes.length).toBeGreaterThan(0);
      expect(notes.every((note) => [0, 4, 7].includes(note.pitchClass))).toBe(
        true
      );
    }
  });

  it('transposes all five CAGED shapes to another chromatic root', () => {
    for (const shape of getCagedShapePositions(2)) {
      const notes = shape.notes.filter((note) => note !== null);
      expect(notes.every((note) => [2, 6, 9].includes(note.pitchClass))).toBe(
        true
      );
    }
  });

  it('rejects invalid roots and pitch classes', () => {
    expect(() => getMajorScalePitchClasses(-1)).toThrow(RangeError);
    expect(() => getTriadPitchClasses(12)).toThrow(RangeError);
    expect(() => getFretboardPositionsForPitchClasses([0, 12])).toThrow(
      RangeError
    );
    expect(() => getCagedShapePositions(1.5)).toThrow(RangeError);
  });
});
