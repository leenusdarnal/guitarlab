import { z } from 'zod';

export const chordStringSchema = z.discriminatedUnion('state', [
  z.object({
    stringNumber: z.number().int().min(1).max(6),
    state: z.literal('muted'),
    fret: z.null(),
    finger: z.null()
  }).strict(),
  z.object({
    stringNumber: z.number().int().min(1).max(6),
    state: z.literal('open'),
    fret: z.literal(0),
    finger: z.null()
  }).strict(),
  z.object({
    stringNumber: z.number().int().min(1).max(6),
    state: z.literal('fretted'),
    fret: z.number().int().min(1).max(24),
    finger: z.number().int().min(1).max(4)
  }).strict()
]);

export type ChordString = z.infer<typeof chordStringSchema>;

export const chordDefinitionSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(12),
  quality: z.enum(['Major', 'Minor']),
  description: z.string().min(1).max(240),
  strings: z.array(chordStringSchema).length(6)
}).strict().superRefine((chord, context) => {
  const stringNumbers = chord.strings
    .map((string) => string.stringNumber)
    .sort((left, right) => left - right);

  if (stringNumbers.some((stringNumber, index) => stringNumber !== index + 1)) {
    context.addIssue({
      code: 'custom',
      path: ['strings'],
      message: 'A chord must define strings 1 through 6 exactly once.'
    });
  }
});

export type ChordDefinition = z.infer<typeof chordDefinitionSchema>;

const open = (stringNumber: number): ChordString => ({
  stringNumber,
  state: 'open',
  fret: 0,
  finger: null
});

const muted = (stringNumber: number): ChordString => ({
  stringNumber,
  state: 'muted',
  fret: null,
  finger: null
});

const fretted = (
  stringNumber: number,
  fret: number,
  finger: number
): ChordString => ({ stringNumber, state: 'fretted', fret, finger });

const chordDefinitions = [
  {
    id: 'c-major',
    name: 'C',
    quality: 'Major',
    description: 'A warm open C major chord. Keep the high e string ringing.',
    strings: [
      muted(6),
      fretted(5, 3, 3),
      fretted(4, 2, 2),
      open(3),
      fretted(2, 1, 1),
      open(1)
    ]
  },
  {
    id: 'g-major',
    name: 'G',
    quality: 'Major',
    description: 'A full open G major shape with the low and high E strings fretted.',
    strings: [
      fretted(6, 3, 3),
      fretted(5, 2, 1),
      open(4),
      open(3),
      open(2),
      fretted(1, 3, 4)
    ]
  },
  {
    id: 'd-major',
    name: 'D',
    quality: 'Major',
    description: 'A bright D major shape. Avoid striking the two muted bass strings.',
    strings: [
      muted(6),
      muted(5),
      open(4),
      fretted(3, 2, 1),
      fretted(2, 3, 3),
      fretted(1, 2, 2)
    ]
  },
  {
    id: 'e-minor',
    name: 'Em',
    quality: 'Minor',
    description: 'A simple two-finger E minor shape using all six strings.',
    strings: [
      open(6),
      fretted(5, 2, 2),
      fretted(4, 2, 3),
      open(3),
      open(2),
      open(1)
    ]
  },
  {
    id: 'a-minor',
    name: 'Am',
    quality: 'Minor',
    description: 'A compact A minor shape. Start strumming from the A string.',
    strings: [
      muted(6),
      open(5),
      fretted(4, 2, 2),
      fretted(3, 2, 3),
      fretted(2, 1, 1),
      open(1)
    ]
  }
] satisfies z.input<typeof chordDefinitionSchema>[];

export const OPEN_CHORDS: readonly ChordDefinition[] = Object.freeze(
  chordDefinitions.map((chord) => chordDefinitionSchema.parse(chord))
);

/** Keep count/accuracy and elapsed time as separate observations. */
export const chordTransitionObservationSchema = z
  .object({
    cleanChanges: z.number().int().min(0).max(10_000),
    totalAttempts: z.number().int().min(0).max(10_000),
    elapsedSeconds: z.number().int().min(0).max(86_400)
  })
  .strict()
  .superRefine((value, context) => {
    if (value.cleanChanges > value.totalAttempts) {
      context.addIssue({
        code: 'custom',
        path: ['cleanChanges'],
        message: 'Clean changes cannot exceed total attempts.'
      });
    }
  });

export type ChordTransitionObservation = z.infer<
  typeof chordTransitionObservationSchema
>;

export function createChordTransitionObservation(
  input: unknown
): ChordTransitionObservation {
  return chordTransitionObservationSchema.parse(input);
}

export function getCleanChangeRate(
  observation: ChordTransitionObservation
): number | null {
  if (observation.totalAttempts === 0) return null;
  return Math.round(
    (observation.cleanChanges / observation.totalAttempts) * 100
  );
}
