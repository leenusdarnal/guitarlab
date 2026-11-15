export type TheoryRecallKind = 'name' | 'sound' | 'use';
export type TheoryRecallAnswer =
  'f_major' | 'g_major' | 'a_minor' | 'major' | 'minor';

export interface TheoryRecallTone {
  frequencyHz: number;
  startMilliseconds: number;
  durationMilliseconds: number;
}

export interface TheoryRecallExercise {
  kind: TheoryRecallKind;
  prompt: string;
  visualHint: string;
  tones: readonly TheoryRecallTone[];
  choices: readonly { value: TheoryRecallAnswer; label: string }[];
  answer: TheoryRecallAnswer;
  explanation: string;
}

const triadChoices = [
  { value: 'f_major', label: 'F major' },
  { value: 'g_major', label: 'G major' },
  { value: 'a_minor', label: 'A minor' }
] as const;

const qualityChoices = [
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' }
] as const;

function assertSequence(sequence: number): void {
  if (!Number.isInteger(sequence) || sequence < 0 || sequence > 100_000) {
    throw new RangeError(
      'Exercise sequence must be a whole number from 0 to 100,000.'
    );
  }
}

function triadTones(midis: readonly number[]): TheoryRecallTone[] {
  return midis.map((midi) => ({
    frequencyHz: 440 * 2 ** ((midi - 69) / 12),
    startMilliseconds: 0,
    durationMilliseconds: 900
  }));
}

/**
 * Build short, deterministic name/sound/use prompts from explicit C-major triads.
 * Audio is synthesized by the browser UI; this module has no audio or storage side effects.
 */
export function createTheoryRecallExercise(
  kind: TheoryRecallKind,
  sequence = 0
): TheoryRecallExercise {
  assertSequence(sequence);

  if (kind === 'name') {
    return {
      kind,
      prompt: 'In C major, which triad is built on scale degree IV?',
      visualHint:
        'The IV chord starts on the fourth note of the C-major scale: C, D, E, F.',
      tones: [],
      choices: triadChoices,
      answer: 'f_major',
      explanation:
        'F major is the IV chord in C major. Its notes are F, A and C.'
    };
  }

  if (kind === 'sound') {
    const isMinor = sequence % 2 === 1;
    const notes = isMinor ? [57, 60, 64] : [60, 64, 67];
    return {
      kind,
      prompt: 'Listen to the triad. Is its quality major or minor?',
      visualHint:
        'Listen to the three notes together. Compare the character of the chord, not its loudness or register.',
      tones: triadTones(notes),
      choices: qualityChoices,
      answer: isMinor ? 'minor' : 'major',
      explanation: isMinor
        ? 'This is A minor: A, C and E. Its triad quality is minor.'
        : 'This is C major: C, E and G. Its triad quality is major.'
    };
  }

  if (kind === 'use') {
    return {
      kind,
      prompt:
        'Which chord is the dominant that creates a pull back to C major?',
      visualHint:
        'In a major key, the dominant triad is built on scale degree V and often leads back to the tonic.',
      tones: [],
      choices: triadChoices,
      answer: 'g_major',
      explanation:
        'G major is the V chord in C major. Its leading tone, B, pulls towards C.'
    };
  }

  throw new RangeError('Choose a supported theory-recall exercise.');
}
