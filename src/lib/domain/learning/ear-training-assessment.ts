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

export type IntervalRecognitionAnswer = (typeof intervalAnswers)[number];

export const intervalRecognitionAssessment = {
  definitionId: 'guitar.ear-training.interval-recognition',
  definitionVersion: 1,
  scoringRuleVersion: 'exact-interval-choice-v1',
  skillId: 'ear.intervals',
  decisionScope: 'supporting_probe' as const
};

export type ScoredIntervalRecognitionResponse = {
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
