export type EarTrainingKind = 'pulse' | 'pitch' | 'contour' | 'interval';
export type EarTrainingAnswer =
  | 'steady'
  | 'uneven'
  | 'first'
  | 'second'
  | 'rising'
  | 'falling'
  | 'level'
  | 'unison'
  | 'minor_third'
  | 'major_third'
  | 'perfect_fifth';

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

const intervalChoices = [
  { value: 'unison', label: 'Same note (unison)' },
  { value: 'minor_third', label: 'Minor third' },
  { value: 'major_third', label: 'Major third' },
  { value: 'perfect_fifth', label: 'Perfect fifth' }
] as const;

const contourChoices = [
  { value: 'rising', label: 'Rising' },
  { value: 'falling', label: 'Falling' },
  { value: 'level', label: 'Staying level' }
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
  sequence = 0
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
    const intervals = [
      {
        semitones: 0,
        answer: 'unison',
        label: 'unison',
        explanation: 'Both notes have the same pitch.'
      },
      {
        semitones: 3,
        answer: 'minor_third',
        label: 'minor third',
        explanation: 'The second note is three semitones above the first.'
      },
      {
        semitones: 4,
        answer: 'major_third',
        label: 'major third',
        explanation: 'The second note is four semitones above the first.'
      },
      {
        semitones: 7,
        answer: 'perfect_fifth',
        label: 'perfect fifth',
        explanation: 'The second note is seven semitones above the first.'
      }
    ] as const;
    const interval = intervals[sequence % intervals.length];
    const firstFrequency = 440;
    const secondFrequency =
      firstFrequency * Math.pow(2, interval.semitones / 12);
    return {
      kind,
      prompt: 'How far apart were the two notes?',
      visualHint:
        'Listen to the distance between the first note and the second. Compare the sound as a whole; you do not need to name either note.',
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
      choices: intervalChoices,
      answer: interval.answer,
      explanation: interval.explanation
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
