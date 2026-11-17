import type {
  EarTrainingAnswer,
  EarTrainingExercise
} from '../music/ear-training';

const intervalAnswers = [
  'unison',
  'minor_second',
  'major_second',
  'minor_third',
  'major_third',
  'perfect_fourth',
  'tritone',
  'perfect_fifth',
  'minor_sixth',
  'major_sixth',
  'minor_seventh',
  'major_seventh',
  'octave'
] as const;

const pulseAnswers = ['steady', 'uneven'] as const;

export type PulseRecognitionAnswer = (typeof pulseAnswers)[number];

export const pulseRecognitionAssessment = {
  definitionId: 'guitar.ear-training.pulse-recognition',
  definitionVersion: 1,
  scoringRuleVersion: 'exact-pulse-pattern-choice-v1',
  skillId: 'ear.rhythm',
  decisionScope: 'supporting_probe' as const
};

export type IntervalRecognitionAnswer = (typeof intervalAnswers)[number];

export const intervalRecognitionAssessment = {
  definitionId: 'guitar.ear-training.interval-recognition',
  definitionVersion: 3,
  scoringRuleVersion: 'exact-interval-choice-v3',
  skillId: 'ear.intervals',
  decisionScope: 'supporting_probe' as const
};

export type ScoredEarTrainingResponse = {
  assessmentInstrument: {
    definitionId: string;
    definitionVersion: number;
    scoringRuleVersion: string;
    itemCount: number;
    passThreshold: number;
    decisionScope: 'supporting_probe';
  };
  itemEvidence: [
    {
      itemId: string;
      response: string;
      outcome: 'correct' | 'incorrect';
      responseSource: 'learner_selected_option';
    }
  ];
  score: 0 | 100;
  outcome: 'passed' | 'needs_practice';
};

export type ScoredIntervalRecognitionResponse = ScoredEarTrainingResponse;
export type ScoredPulseRecognitionResponse = ScoredEarTrainingResponse;
export type ScoredChordMovementResponse = ScoredEarTrainingResponse;

export const chordMovementRecognitionAssessment = {
  definitionId: 'guitar.ear-training.chord-movement-recognition',
  definitionVersion: 1,
  scoringRuleVersion: 'exact-chord-function-choice-v1',
  skillId: 'harmony.triads',
  decisionScope: 'supporting_probe' as const
};

/**
 * Score only the learner's explicit interval selection against the
 * deterministic, browser-generated exercise answer. This is a supporting
 * probe, not evidence of whole-skill mastery or physical performance.
 */
export function scoreIntervalRecognitionResponse(
  exercise: EarTrainingExercise,
  response: EarTrainingAnswer
): ScoredIntervalRecognitionResponse {
  if (exercise.kind !== 'interval') {
    throw new Error('Only interval-recognition exercises can be scored here.');
  }
  if (
    !intervalAnswers.includes(response as IntervalRecognitionAnswer) ||
    !exercise.choices.some((choice) => choice.value === response)
  ) {
    throw new Error('The selected answer is not valid for this interval item.');
  }

  const correct = response === exercise.answer;
  return {
    assessmentInstrument: {
      definitionId: intervalRecognitionAssessment.definitionId,
      definitionVersion: intervalRecognitionAssessment.definitionVersion,
      scoringRuleVersion: intervalRecognitionAssessment.scoringRuleVersion,
      itemCount: 1,
      passThreshold: 100,
      decisionScope: intervalRecognitionAssessment.decisionScope
    },
    itemEvidence: [
      {
        itemId: `interval-recognition.${exercise.answer}`,
        response,
        outcome: correct ? 'correct' : 'incorrect',
        responseSource: 'learner_selected_option'
      }
    ],
    score: correct ? 100 : 0,
    outcome: correct ? 'passed' : 'needs_practice'
  };
}

/**
 * Score only the learner's explicit steady/uneven selection against the
 * deterministic, browser-generated four-beat pattern. This is a supporting
 * probe for rhythm recognition, not evidence of performed pulse control.
 */
export function scorePulseRecognitionResponse(
  exercise: EarTrainingExercise,
  response: EarTrainingAnswer
): ScoredPulseRecognitionResponse {
  if (exercise.kind !== 'pulse') {
    throw new Error('Only pulse-recognition exercises can be scored here.');
  }
  if (!pulseAnswers.includes(exercise.answer as PulseRecognitionAnswer)) {
    throw new Error('The pulse item does not have an authored answer.');
  }
  if (
    !pulseAnswers.includes(response as PulseRecognitionAnswer) ||
    !exercise.choices.some((choice) => choice.value === response)
  ) {
    throw new Error('The selected answer is not valid for this pulse item.');
  }

  const correct = response === exercise.answer;
  const itemId =
    exercise.answer === 'steady'
      ? 'pulse-recognition.equal-500ms-gaps'
      : 'pulse-recognition.alternating-340-700ms-gaps';

  return {
    assessmentInstrument: {
      definitionId: pulseRecognitionAssessment.definitionId,
      definitionVersion: pulseRecognitionAssessment.definitionVersion,
      scoringRuleVersion: pulseRecognitionAssessment.scoringRuleVersion,
      itemCount: 1,
      passThreshold: 100,
      decisionScope: pulseRecognitionAssessment.decisionScope
    },
    itemEvidence: [
      {
        itemId,
        response,
        outcome: correct ? 'correct' : 'incorrect',
        responseSource: 'learner_selected_option'
      }
    ],
    score: correct ? 100 : 0,
    outcome: correct ? 'passed' : 'needs_practice'
  };
}

/**
 * Score the learner's explicit IV/V chord-function choice in a generated
 * I–IV–I or I–V–I progression. This is an auditory supporting probe only:
 * it does not claim that the learner can play the chord or establish mastery.
 */
export function scoreChordMovementResponse(
  exercise: EarTrainingExercise,
  response: EarTrainingAnswer
): ScoredChordMovementResponse {
  if (exercise.kind !== 'chord-movement') {
    throw new Error('Only chord-movement exercises can be scored here.');
  }
  if (exercise.answer !== 'subdominant' && exercise.answer !== 'dominant') {
    throw new Error('The chord-movement item does not have an authored answer.');
  }
  if (
    (response !== 'subdominant' && response !== 'dominant') ||
    !exercise.choices.some((choice) => choice.value === response)
  ) {
    throw new Error(
      'The selected answer is not valid for this chord-movement item.'
    );
  }

  const correct = response === exercise.answer;
  return {
    assessmentInstrument: {
      definitionId: chordMovementRecognitionAssessment.definitionId,
      definitionVersion: chordMovementRecognitionAssessment.definitionVersion,
      scoringRuleVersion: chordMovementRecognitionAssessment.scoringRuleVersion,
      itemCount: 1,
      passThreshold: 100,
      decisionScope: chordMovementRecognitionAssessment.decisionScope
    },
    itemEvidence: [
      {
        itemId: `chord-movement.${exercise.answer}-between-tonic`,
        response,
        outcome: correct ? 'correct' : 'incorrect',
        responseSource: 'learner_selected_option'
      }
    ],
    score: correct ? 100 : 0,
    outcome: correct ? 'passed' : 'needs_practice'
  };
}
