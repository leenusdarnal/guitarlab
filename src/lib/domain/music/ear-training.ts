export type EarTrainingKind =
  'pulse' | 'pitch' | 'contour' | 'interval' | 'chord-movement';

export type EarTrainingIntervalSet =
  'foundation' | 'steps-and-tritone' | 'wide-leaps';

export type EarTrainingAnswer =
  | 'steady'
  | 'uneven'
  | 'first'
  | 'second'
  | 'rising'
  | 'falling'
  | 'level'
  | 'unison'
  | 'minor_second'
  | 'major_second'
  | 'minor_third'
  | 'major_third'
  | 'perfect_fourth'
  | 'tritone'
  | 'perfect_fifth'
  | 'minor_sixth'
  | 'major_sixth'
  | 'minor_seventh'
  | 'major_seventh'
  | 'octave'
  | 'subdominant'
  | 'dominant';

export interface EarTrainingTone {
  frequencyHz: number;
  startMilliseconds: number;
  durationMilliseconds: number;
}

export interface EarTrainingExercise {
  kind: EarTrainingKind;
  prompt: string;
  visualHint: string;
  tones: readonly EarTrainingTone[];
  choices: readonly { value: EarTrainingAnswer; label: string }[];
  answer: EarTrainingAnswer;
  explanation: string;
}

const pulseChoices = [
  { value: 'steady', label: 'Steady pulse' },
  { value: 'uneven', label: 'Uneven pulse' }
] as const;

const pitchChoices = [
  { value: 'first', label: 'First note' },
  { value: 'second', label: 'Second note' }
] as const;

type IntervalAnswer = Extract<
  EarTrainingAnswer,
  | 'unison'
  | 'minor_second'
  | 'major_second'
  | 'minor_third'
  | 'major_third'
  | 'perfect_fourth'
  | 'tritone'
  | 'perfect_fifth'
  | 'minor_sixth'
  | 'major_sixth'
  | 'minor_seventh'
  | 'major_seventh'
  | 'octave'
>;

interface IntervalDefinition {
  semitones: number;
  answer: IntervalAnswer;
  label: string;
}

const intervalDefinitions: Record<
  EarTrainingIntervalSet,
  readonly IntervalDefinition[]
> = {
  foundation: [
    { semitones: 0, answer: 'unison', label: 'Same note (unison)' },
    { semitones: 3, answer: 'minor_third', label: 'Minor third' },
    { semitones: 4, answer: 'major_third', label: 'Major third' },
    { semitones: 7, answer: 'perfect_fifth', label: 'Perfect fifth' }
  ],
  'steps-and-tritone': [
    { semitones: 1, answer: 'minor_second', label: 'Minor second' },
    { semitones: 2, answer: 'major_second', label: 'Major second' },
    { semitones: 5, answer: 'perfect_fourth', label: 'Perfect fourth' },
    { semitones: 6, answer: 'tritone', label: 'Tritone (six semitones)' }
  ],
  'wide-leaps': [
    { semitones: 8, answer: 'minor_sixth', label: 'Minor sixth' },
    { semitones: 9, answer: 'major_sixth', label: 'Major sixth' },
    { semitones: 10, answer: 'minor_seventh', label: 'Minor seventh' },
    { semitones: 11, answer: 'major_seventh', label: 'Major seventh' },
    { semitones: 12, answer: 'octave', label: 'Octave' }
  ]
};

/**
 * Each interval class cycles through all 24 chromatic roots from C3 to B4.
 * The stride is coprime with 24 for both supported set sizes (four and five),
 * so every interval is heard from every root before repeating.
 */
const intervalRootMidiNotes = [
  48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66,
  67, 68, 69, 70, 71
] as const;

function intervalRootStride(intervalCount: number): number {
  return intervalCount === 4 ? 5 : 7;
}

function midiToFrequency(midiNote: number): number {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}

const contourChoices = [
  { value: 'rising', label: 'Rising' },
  { value: 'falling', label: 'Falling' },
  { value: 'level', label: 'Staying level' }
] as const;

const chordMovementChoices = [
  { value: 'subdominant', label: 'F major (IV)' },
  { value: 'dominant', label: 'G major (V)' }
] as const;

function assertSequence(sequence: number): void {
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 100_000) {
    throw new RangeError(
      'Exercise sequence must be a whole number from 0 to 100,000.'
    );
  }
}

/**
 * Creates reproducible listening challenges. The answer is returned to the
 * exercise controller, not rendered in the learner-facing prompt.
 */
export function createEarTrainingExercise(
  kind: EarTrainingKind,
  sequence = 0,
  intervalSet: EarTrainingIntervalSet = 'foundation'
): EarTrainingExercise {
  assertSequence(sequence);

  if (kind === 'pulse') {
    const uneven = sequence % 2 === 1;
    const starts = uneven ? [0, 340, 1_040, 1_380] : [0, 500, 1_000, 1_500];
    return {
      kind,
      prompt: 'Listen to the four beats. Is the pulse even?',
      visualHint:
        'Count four beats and notice whether the spaces between them stay the same.',
      tones: starts.map((startMilliseconds) => ({
        frequencyHz: 880,
        startMilliseconds,
        durationMilliseconds: 100
      })),
      choices: pulseChoices,
      answer: uneven ? 'uneven' : 'steady',
      explanation: uneven
        ? 'The gaps alternate between shorter and longer, so the pulse is uneven.'
        : 'Each beat is separated by the same amount of time, so the pulse is steady.'
    };
  }

  if (kind === 'pitch') {
    const firstIsHigher = sequence % 2 === 0;
    const firstFrequency = firstIsHigher ? 660 : 440;
    const secondFrequency = firstIsHigher ? 440 : 660;
    return {
      kind,
      prompt: 'Which of the two notes sounded higher?',
      visualHint:
        'Listen to both notes. Higher pitch sounds brighter; lower pitch sounds deeper.',
      tones: [
        {
          frequencyHz: firstFrequency,
          startMilliseconds: 0,
          durationMilliseconds: 320
        },
        {
          frequencyHz: secondFrequency,
          startMilliseconds: 560,
          durationMilliseconds: 320
        }
      ],
      choices: pitchChoices,
      answer: firstIsHigher ? 'first' : 'second',
      explanation: firstIsHigher
        ? 'The first note had the higher frequency.'
        : 'The second note had the higher frequency.'
    };
  }

  if (kind === 'interval') {
    const intervals = intervalDefinitions[intervalSet];
    if (!intervals) {
      throw new RangeError('Choose a supported interval practice set.');
    }
    const interval = intervals[sequence % intervals.length];
    const intervalPosition = sequence % intervals.length;
    const intervalCycle = Math.floor(sequence / intervals.length);
    const rootStride = intervalRootStride(intervals.length);
    const firstMidiNote =
      intervalRootMidiNotes[
        (intervalPosition + intervalCycle * rootStride) %
          intervalRootMidiNotes.length
      ];
    const firstFrequency = midiToFrequency(firstMidiNote);
    const secondFrequency = midiToFrequency(
      firstMidiNote + interval.semitones
    );
    const visualHint =
      intervalSet === 'foundation'
        ? 'Start with familiar anchors: a repeated note, thirds and a fifth. Listen for the distance, not the absolute pitch.'
        : intervalSet === 'steps-and-tritone'
          ? 'Compare close steps with the wider tritone. The labels describe the ascending distance between the two notes.'
          : 'Listen for the wider leaps: sixths, sevenths and an octave. The second note is always above the first.';
    const explanation =
      interval.semitones === 0
        ? 'Both notes have the same pitch.'
        : `The second note is ${interval.semitones} semitone${interval.semitones === 1 ? '' : 's'} above the first: a ${interval.label.toLowerCase()}.`;
    return {
      kind,
      prompt: 'How far apart were the two notes?',
      visualHint,
      tones: [
        {
          frequencyHz: firstFrequency,
          startMilliseconds: 0,
          durationMilliseconds: 360
        },
        {
          frequencyHz: secondFrequency,
          startMilliseconds: 620,
          durationMilliseconds: 360
        }
      ],
      choices: intervals.map(({ answer, label }) => ({
        value: answer,
        label
      })),
      answer: interval.answer,
      explanation
    };
  }

  if (kind === 'chord-movement') {
    // C major (I) anchors both ends. The middle chord alternates between
    // F major (IV) and G major (V), so the answer is an explicit chord choice.
    const middleAnswer = sequence % 2 === 0 ? 'subdominant' : 'dominant';
    const chordMidis =
      middleAnswer === 'subdominant'
        ? [
            [60, 64, 67],
            [65, 69, 72],
            [60, 64, 67]
          ]
        : [
            [60, 64, 67],
            [67, 71, 74],
            [60, 64, 67]
          ];
    const startMilliseconds = [0, 900, 1_800];
    return {
      kind,
      prompt: 'Which chord was heard between the two C major chords?',
      visualHint:
        'The first and final chords are both C major. Listen to the middle chord and compare its sound and movement.',
      tones: chordMidis.flatMap((chord, chordIndex) =>
        chord.map((midi) => ({
          frequencyHz: 440 * 2 ** ((midi - 69) / 12),
          startMilliseconds: startMilliseconds[chordIndex],
          durationMilliseconds: 640
        }))
      ),
      choices: chordMovementChoices,
      answer: middleAnswer,
      explanation:
        middleAnswer === 'subdominant'
          ? 'The middle chord was F major, the IV chord in C major.'
          : 'The middle chord was G major, the V chord in C major.'
    };
  }

  if (kind === 'contour') {
    const contour = sequence % 3;
    const frequencies =
      contour === 0
        ? [440, 523.25, 659.25]
        : contour === 1
          ? [659.25, 523.25, 440]
          : [523.25, 523.25, 523.25];
    const answer =
      contour === 0 ? 'rising' : contour === 1 ? 'falling' : 'level';
    return {
      kind,
      prompt: 'Follow the three notes. What shape did the melody make?',
      visualHint:
        'Listen from the first note to the last and follow the direction of the pitch.',
      tones: frequencies.map((frequencyHz, index) => ({
        frequencyHz,
        startMilliseconds: index * 460,
        durationMilliseconds: 300
      })),
      choices: contourChoices,
      answer,
      explanation:
        answer === 'rising'
          ? 'Each note moved higher than the one before it.'
          : answer === 'falling'
            ? 'Each note moved lower than the one before it.'
            : 'All three notes used the same pitch.'
    };
  }

  throw new RangeError('Choose a supported ear-training exercise.');
}
