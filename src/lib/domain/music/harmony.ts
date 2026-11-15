import {
  SHARP_NOTE_NAMES,
  STANDARD_GUITAR_TUNING,
  getFretboardLayout,
  getNoteAtPosition,
  type FretboardNote,
  type GuitarTuning
} from './fretboard';

export type ChordQuality = 'major' | 'minor';
export type TriadInversion = 'root' | 'first' | 'second';
export type CagedShapeName = 'C' | 'A' | 'G' | 'E' | 'D';

export interface CagedShapePosition {
  shape: CagedShapeName;
  /** Notes are ordered from string 6 (low E) to string 1 (high E); null is muted. */
  notes: readonly (FretboardNote | null)[];
  fretLabel: string;
}

const MAJOR_SCALE_STEPS = [2, 2, 1, 2, 2, 2, 1] as const;
const MAJOR_TRIAD_INTERVALS = [0, 4, 7] as const;
const MINOR_TRIAD_INTERVALS = [0, 3, 7] as const;

const TRIAD_INVERSION_VOICINGS: Record<
  TriadInversion,
  readonly { stringNumber: number; fret: number }[]
> = {
  root: [
    { stringNumber: 5, fret: 3 },
    { stringNumber: 4, fret: 2 },
    { stringNumber: 3, fret: 0 }
  ],
  first: [
    { stringNumber: 4, fret: 2 },
    { stringNumber: 3, fret: 0 },
    { stringNumber: 2, fret: 1 }
  ],
  second: [
    { stringNumber: 3, fret: 0 },
    { stringNumber: 2, fret: 1 },
    { stringNumber: 1, fret: 0 }
  ]
};

const CAGED_C_MAJOR_FRETS: readonly {
  shape: CagedShapeName;
  frets: readonly (number | null)[];
}[] = [
  { shape: 'C', frets: [null, 3, 2, 0, 1, 0] },
  { shape: 'A', frets: [null, 3, 5, 5, 5, 3] },
  { shape: 'G', frets: [8, 7, 5, 5, 5, 8] },
  { shape: 'E', frets: [8, 10, 10, 9, 8, 8] },
  { shape: 'D', frets: [null, null, 10, 12, 13, 12] }
];

/** Validate a chromatic pitch class before using it in shared theory calculations. */
function assertPitchClass(pitchClass: number): void {
  if (!Number.isInteger(pitchClass) || pitchClass < 0 || pitchClass > 11) {
    throw new RangeError('Pitch class must be a whole number from 0 to 11.');
  }
}

/** Return the seven pitch classes of a major scale, starting from its root. */
export function getMajorScalePitchClasses(rootPitchClass: number): number[] {
  assertPitchClass(rootPitchClass);
  const result = [rootPitchClass];
  let current = rootPitchClass;
  for (const step of MAJOR_SCALE_STEPS.slice(0, -1)) {
    current = (current + step) % 12;
    result.push(current);
  }
  return result;
}

/** Return a triad in root, first or second inversion order. */
export function getTriadPitchClasses(
  rootPitchClass: number,
  quality: ChordQuality = 'major',
  inversion: TriadInversion = 'root'
): number[] {
  assertPitchClass(rootPitchClass);
  const intervals =
    quality === 'major' ? MAJOR_TRIAD_INTERVALS : MINOR_TRIAD_INTERVALS;
  const rootPosition = intervals.map(
    (interval) => (rootPitchClass + interval) % 12
  );
  if (inversion === 'root') return rootPosition;
  if (inversion === 'first')
    return [rootPosition[1], rootPosition[2], rootPosition[0]];
  return [rootPosition[2], rootPosition[0], rootPosition[1]];
}

export function getTriadInversionPositions(
  rootPitchClass: number,
  inversion: TriadInversion
): FretboardNote[] {
  assertPitchClass(rootPitchClass);
  return TRIAD_INVERSION_VOICINGS[inversion].map(({ stringNumber, fret }) =>
    getNoteAtPosition(stringNumber, fret + rootPitchClass)
  );
}

/** Resolve selected theory pitch classes to the existing canonical fretboard note records. */
export function getFretboardPositionsForPitchClasses(
  pitchClasses: readonly number[],
  maxFret = 12,
  tuning: GuitarTuning = STANDARD_GUITAR_TUNING
): FretboardNote[] {
  for (const pitchClass of pitchClasses) assertPitchClass(pitchClass);
  const accepted = new Set(pitchClasses);
  return getFretboardLayout(maxFret, tuning)
    .flat()
    .filter((note) => accepted.has(note.pitchClass));
}

/**
 * Return the five standard CAGED C-major forms, shifted chromatically to a
 * requested root. The shape diagrams use standard E tuning and the canonical
 * getNoteAtPosition function so string/fret/note labels cannot drift apart.
 */
export function getCagedShapePositions(
  rootPitchClass = 0
): CagedShapePosition[] {
  assertPitchClass(rootPitchClass);
  const fretOffset = rootPitchClass;
  return CAGED_C_MAJOR_FRETS.map(({ shape, frets }) => {
    const notes = frets.map((baseFret, index) => {
      if (baseFret === null) return null;
      const fret = baseFret + fretOffset;
      if (fret > 24) {
        throw new RangeError(
          'The transposed CAGED shape exceeds the supported 24-fret range.'
        );
      }
      return getNoteAtPosition(6 - index, fret);
    });
    return {
      shape,
      notes,
      fretLabel: frets
        .map((fret) => (fret === null ? 'x' : String(fret + fretOffset)))
        .join('')
    };
  });
}

/** Human-readable sharp-spelled labels for scale degrees and triads. */
export function getHarmonyPitchClassNames(
  pitchClasses: readonly number[]
): string[] {
  for (const pitchClass of pitchClasses) assertPitchClass(pitchClass);
  return pitchClasses.map((pitchClass) => SHARP_NOTE_NAMES[pitchClass]);
}
