export type NoteSpelling = 'sharp' | 'flat';
export type GuitarHandedness = 'right' | 'left';

export interface TunedString {
  /** Guitar string number: 1 is the highest-pitched string, 6 the lowest. */
  stringNumber: number;
  /** MIDI note number for the open string. */
  openMidi: number;
}

export interface GuitarTuning {
  id: string;
  name: string;
  strings: readonly TunedString[];
}

export interface FretboardNote {
  stringNumber: number;
  fret: number;
  midi: number;
  pitchClass: number;
  noteName: string;
  octave: number;
  frequencyHz: number;
}

export const SHARP_NOTE_NAMES = [
  'C',
  'C♯',
  'D',
  'D♯',
  'E',
  'F',
  'F♯',
  'G',
  'G♯',
  'A',
  'A♯',
  'B'
] as const;

export const FLAT_NOTE_NAMES = [
  'C',
  'D♭',
  'D',
  'E♭',
  'E',
  'F',
  'G♭',
  'G',
  'A♭',
  'A',
  'B♭',
  'B'
] as const;

/** Standard six-string E–A–D–G–B–E tuning, from string 6 to string 1. */
export const STANDARD_GUITAR_TUNING: GuitarTuning = {
  id: 'standard-e',
  name: 'Standard E (E–A–D–G–B–E)',
  strings: [
    { stringNumber: 6, openMidi: 40 },
    { stringNumber: 5, openMidi: 45 },
    { stringNumber: 4, openMidi: 50 },
    { stringNumber: 3, openMidi: 55 },
    { stringNumber: 2, openMidi: 59 },
    { stringNumber: 1, openMidi: 64 }
  ]
};

function assertValidTuning(tuning: GuitarTuning): void {
  if (tuning.strings.length !== 6) {
    throw new RangeError('A guitar tuning must define exactly six strings.');
  }

  const stringNumbers = new Set<number>();
  for (const string of tuning.strings) {
    if (
      !Number.isInteger(string.stringNumber) ||
      string.stringNumber < 1 ||
      string.stringNumber > 6 ||
      stringNumbers.has(string.stringNumber)
    ) {
      throw new RangeError(
        'A guitar tuning must define each string number from 1 to 6 once.'
      );
    }
    if (
      !Number.isInteger(string.openMidi) ||
      string.openMidi < 28 ||
      string.openMidi > 88
    ) {
      throw new RangeError(
        'Open-string MIDI pitches must be whole notes from 28 to 88.'
      );
    }
    stringNumbers.add(string.stringNumber);
  }
}

function assertValidFret(fret: number): void {
  if (!Number.isInteger(fret) || fret < 0 || fret > 24) {
    throw new RangeError('Fret must be a whole number from 0 to 24.');
  }
}

export function midiToFrequency(midi: number): number {
  if (!Number.isFinite(midi) || midi < 0 || midi > 127) {
    throw new RangeError('MIDI note must be a finite value from 0 to 127.');
  }
  return 440 * 2 ** ((midi - 69) / 12);
}

export function getNoteAtPosition(
  stringNumber: number,
  fret: number,
  tuning: GuitarTuning = STANDARD_GUITAR_TUNING,
  spelling: NoteSpelling = 'sharp'
): FretboardNote {
  assertValidTuning(tuning);
  assertValidFret(fret);

  const tunedString = tuning.strings.find(
    (string) => string.stringNumber === stringNumber
  );
  if (!tunedString) {
    throw new RangeError('String number must be from 1 to 6.');
  }

  const midi = tunedString.openMidi + fret;
  const pitchClass = midi % 12;
  const noteNames = spelling === 'flat' ? FLAT_NOTE_NAMES : SHARP_NOTE_NAMES;

  return {
    stringNumber,
    fret,
    midi,
    pitchClass,
    noteName: noteNames[pitchClass],
    octave: Math.floor(midi / 12) - 1,
    frequencyHz: midiToFrequency(midi)
  };
}

/**
 * Returns notes in visual row order: high E/string 1 at the top, low E/string 6
 * at the bottom. Pitch and string identity never depend on display handedness.
 */
export function getFretboardLayout(
  maxFret = 12,
  tuning: GuitarTuning = STANDARD_GUITAR_TUNING,
  spelling: NoteSpelling = 'sharp'
): FretboardNote[][] {
  assertValidTuning(tuning);
  if (!Number.isInteger(maxFret) || maxFret < 0 || maxFret > 24) {
    throw new RangeError('Maximum fret must be a whole number from 0 to 24.');
  }

  return [...tuning.strings]
    .sort((left, right) => left.stringNumber - right.stringNumber)
    .map((string) =>
      Array.from({ length: maxFret + 1 }, (_, fret) =>
        getNoteAtPosition(string.stringNumber, fret, tuning, spelling)
      )
    );
}

/** Grid column for a fret, mirroring only the physical display for left-handed players. */
export function getDisplayFretColumn(
  fret: number,
  maxFret: number,
  handedness: GuitarHandedness
): number {
  assertValidFret(fret);
  if (!Number.isInteger(maxFret) || maxFret < fret || maxFret > 24) {
    throw new RangeError(
      'Maximum fret must be a whole number between the selected fret and 24.'
    );
  }

  return handedness === 'left' ? maxFret - fret + 1 : fret + 1;
}

export function findFretboardPositions(
  pitchClass: number,
  maxFret = 12,
  tuning: GuitarTuning = STANDARD_GUITAR_TUNING
): FretboardNote[] {
  if (!Number.isInteger(pitchClass) || pitchClass < 0 || pitchClass > 11) {
    throw new RangeError('Pitch class must be a whole number from 0 to 11.');
  }

  return getFretboardLayout(maxFret, tuning)
    .flat()
    .filter((note) => note.pitchClass === pitchClass);
}
