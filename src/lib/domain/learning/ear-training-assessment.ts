import type {
  EarTrainingAnswer,
  EarTrainingExercise
} from '../music/ear-training';

const intervalAnswers = [
  'unison',
  'minor_third',
  'major_third',
  'perfect_fifth'
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
  definitionVersion: 1,
  scoringRuleVersion: 'exact-interval-choice-v1',
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
