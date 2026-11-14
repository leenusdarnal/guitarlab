export const standardTuningAssessment = {
  definitionId: 'guitar.standard-tuning-open-pitches',
  definitionVersion: 1,
  scoringRuleVersion: 'exact-pitch-five-of-six-v1',
  curriculumReleaseId: 'curriculum-v1.0.6',
  lessonId: 'y1-w01-lesson',
  skillId: 'instrument.tuning',
  passThreshold: 5,
  title: 'Standard tuning: open-string pitch check',
  description:
    'Identify the standard open pitch for each numbered guitar string. This checks pitch-name recall, not the physical tuning of your instrument.',
  options: ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'],
  items: [
    {
      id: 'standard-tuning.string-6-open-pitch',
      prompt: 'What is the standard open pitch of the 6th (lowest) string?',
      correctAnswer: 'E2'
    },
    {
      id: 'standard-tuning.string-5-open-pitch',
      prompt: 'What is the standard open pitch of the 5th string?',
      correctAnswer: 'A2'
    },
    {
      id: 'standard-tuning.string-4-open-pitch',
      prompt: 'What is the standard open pitch of the 4th string?',
      correctAnswer: 'D3'
    },
    {
      id: 'standard-tuning.string-3-open-pitch',
      prompt: 'What is the standard open pitch of the 3rd string?',
      correctAnswer: 'G3'
    },
    {
      id: 'standard-tuning.string-2-open-pitch',
      prompt: 'What is the standard open pitch of the 2nd string?',
      correctAnswer: 'B3'
    },
    {
      id: 'standard-tuning.string-1-open-pitch',
      prompt: 'What is the standard open pitch of the 1st (highest) string?',
      correctAnswer: 'E4'
    }
  ]
} as const;

export type StandardTuningItemId =
  (typeof standardTuningAssessment.items)[number]['id'];

export type StandardTuningAnswers = Partial<
  Record<StandardTuningItemId, string>
>;

export type ScoredStandardTuningItem = {
  itemId: StandardTuningItemId;
  response: string | null;
  outcome: 'correct' | 'incorrect' | 'inconclusive';
  responseSource: 'learner_selected_option' | 'no_response';
};

export type ScoredStandardTuningAssessment = {
  assessmentInstrument: {
    definitionId: string;
    definitionVersion: number;
    scoringRuleVersion: string;
  };
  itemEvidence: ScoredStandardTuningItem[];
  correctCount: number;
  answeredCount: number;
  totalItems: number;
  score: number | null;
  outcome: 'passed' | 'needs_practice' | 'inconclusive';
};

/**
 * Score only explicit learner selections against the authored answer key.
 * Missing responses remain inconclusive; no audio, repetition or self-rating
 * is interpreted as correctness.
 */
export function scoreStandardTuningAssessment(
  answers: StandardTuningAnswers
): ScoredStandardTuningAssessment {
  const allowedItemIds = new Set(
    standardTuningAssessment.items.map((item) => item.id)
  );
  for (const [itemId, response] of Object.entries(answers)) {
    if (!allowedItemIds.has(itemId as StandardTuningItemId)) {
      throw new Error('The assessment contains an unknown item identifier.');
    }
    if (
      response !== undefined &&
      !standardTuningAssessment.options.includes(
        response as (typeof standardTuningAssessment.options)[number]
      )
    ) {
      throw new Error('The selected pitch is not one of the authored options.');
    }
  }

  const itemEvidence = standardTuningAssessment.items.map((item) => {
    const response = answers[item.id] ?? null;
    return {
      itemId: item.id,
      response,
      outcome:
        response === null
          ? ('inconclusive' as const)
          : response === item.correctAnswer
            ? ('correct' as const)
            : ('incorrect' as const),
      responseSource:
        response === null
          ? ('no_response' as const)
          : ('learner_selected_option' as const)
    };
  });
  const answeredCount = itemEvidence.filter(
    (item) => item.response !== null
  ).length;
  const correctCount = itemEvidence.filter(
    (item) => item.outcome === 'correct'
  ).length;
  const isComplete = answeredCount === standardTuningAssessment.items.length;
  const score = isComplete
    ? Math.round((correctCount / standardTuningAssessment.items.length) * 100)
    : null;

  return {
    assessmentInstrument: {
      definitionId: standardTuningAssessment.definitionId,
      definitionVersion: standardTuningAssessment.definitionVersion,
      scoringRuleVersion: standardTuningAssessment.scoringRuleVersion,
      decisionScope: 'supporting_probe'
    },
    itemEvidence,
    correctCount,
    answeredCount,
    totalItems: standardTuningAssessment.items.length,
    score,
    outcome: !isComplete
      ? 'inconclusive'
      : correctCount >= standardTuningAssessment.passThreshold
        ? 'passed'
        : 'needs_practice'
  };
}
