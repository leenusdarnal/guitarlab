export const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B'
] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type HandednessView = 'right' | 'left';

export type GuitarString = {
  stringNumber: number;
  label: string;
  openMidi: number;
};

export type GuitarNote = {
  stringNumber: number;
  stringLabel: string;
  fret: number;
  midi: number;
  name: NoteName;
  octave: number;
  frequencyHz: number;
};

export type FretboardRow = {
  string: GuitarString;
  notes: GuitarNote[];
};

/** Standard tuning is ordered from the lowest-pitched string to the highest. */
export const STANDARD_TUNING: readonly GuitarString[] = [
  { stringNumber: 6, label: 'E', openMidi: 40 },
  { stringNumber: 5, label: 'A', openMidi: 45 },
  { stringNumber: 4, label: 'D', openMidi: 50 },
  { stringNumber: 3, label: 'G', openMidi: 55 },
  { stringNumber: 2, label: 'B', openMidi: 59 },
  { stringNumber: 1, label: 'e', openMidi: 64 }
];

export function getNoteAtFret(
  string: GuitarString,
  fret: number
): GuitarNote {
  if (!Number.isInteger(fret) || fret < 0 || fret > 24) {
    throw new RangeError('Fret must be a whole number between 0 and 24.');
  }
  if (
    !Number.isInteger(string.openMidi) ||
    string.openMidi < 0 ||
    string.openMidi > 127 ||
    !Number.isInteger(string.stringNumber) ||
    string.stringNumber < 1 ||
    string.stringNumber > 12
  ) {
    throw new RangeError('The guitar string pitch or number is invalid.');
  }

  const midi = string.openMidi + fret;
  if (midi > 127) {
    throw new RangeError('The resulting MIDI note is outside the supported range.');
  }
  const pitchClass = midi % 12;
  return {
    stringNumber: string.stringNumber,
    stringLabel: string.label,
    fret,
    midi,
    name: NOTE_NAMES[pitchClass],
    octave: Math.floor(midi / 12) - 1,
    frequencyHz: 440 * 2 ** ((midi - 69) / 12)
  };
}

export function getFretboardRows(input?: {
  tuning?: readonly GuitarString[];
  fretCount?: number;
  handedness?: HandednessView;
}): FretboardRow[] {
  const tuning = input?.tuning ?? STANDARD_TUNING;
  const fretCount = input?.fretCount ?? 12;
  if (!Number.isInteger(fretCount) || fretCount < 0 || fretCount > 24) {
    throw new RangeError('Fret count must be a whole number between 0 and 24.');
  }

  // Mirroring changes only presentation order. String IDs and pitch stay attached.
  const displayed = [...tuning];
  if (input?.handedness === 'left') displayed.reverse();

  return displayed.map((string) => ({
    string,
    notes: Array.from({ length: fretCount + 1 }, (_, fret) =>
      getNoteAtFret(string, fret)
    )
  }));
}

export function isEnharmonicMatch(note: GuitarNote, target: NoteName): boolean {
  return note.name === target;
}
