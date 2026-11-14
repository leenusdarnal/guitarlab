import { describe, expect, it } from 'vitest';
import type {
  AdaptiveRecommendationFeedbackRecord,
  AssessmentAttemptRecord,
  PracticeEvidenceRecord,
  SkillMasteryRecord,
  SkillRecord
} from '../repositories/contracts';
import {
  buildAdaptivePracticeSnapshot,
  resolveAdaptiveRecommendationFeedback
} from './adaptive-practice';

const skills: SkillRecord[] = [
  { id: 'rhythm.pulse', category: 'rhythm', displayName: 'Pulse' },
  { id: 'ear.intervals', category: 'ear', displayName: 'Intervals' },
  {
    id: 'fretting.clean-tone',
    category: 'technique',
    displayName: 'Clean tone'
  }
];

function attempt(
  id: string,
  skillId: string,
  outcome: AssessmentAttemptRecord['outcome'],
  assessedAt: number,
  score: number | null = null,
  evidenceType: AssessmentAttemptRecord['evidenceType'] = 'measured'
): AssessmentAttemptRecord {
  return {
    id,
    learnerId: '00000000-0000-4000-8000-000000000001',
    curriculumReleaseId: 'curriculum-v1',
    skillId,
    lessonId: null,
    assessmentKind: 'measured',
    evidenceType,
    outcome,
    score,
    evidenceSummary: null,
    evidence: {},
    assessedAt,
    recordedAt: assessedAt
  };
}

function itemAttempt(
  id: string,
  skillId: string,
  itemId: string,
  response: string | null,
  outcome: 'correct' | 'incorrect' | 'inconclusive',
  assessedAt: number,
  definitionId = 'guitar.ear-training.interval-recognition',
  scoringRuleVersion = 'exact-interval-choice-v1'
): AssessmentAttemptRecord {
  const attemptOutcome =
    outcome === 'correct'
      ? 'passed'
      : outcome === 'incorrect'
        ? 'needs_practice'
        : 'inconclusive';
  return {
    ...attempt(
      id,
      skillId,
      attemptOutcome,
      assessedAt,
      outcome === 'correct' ? 100 : outcome === 'incorrect' ? 0 : null
    ),
    assessmentInstrument: {
      definitionId,
      definitionVersion: 1,
      scoringRuleVersion,
      itemCount: 1,
      passThreshold: 100,
      decisionScope: 'supporting_probe'
    },
    itemEvidence: [
      {
        itemId,
        response,
        outcome,
        responseSource:
          response === null ? 'no_response' : 'learner_selected_option'
      }
    ]
  };
}

function observation(
  id: string,
  exerciseId: string,
  difficulty: number | null,
  recordedAt: number
): PracticeEvidenceRecord {
  return {
    id,
    learnerId: '00000000-0000-4000-8000-000000000001',
    sessionId: '00000000-0000-4000-8000-000000000002',
    exerciseId,
    repetitions: 10,
    cleanRepetitions: 9,
    tempoBpm: 80,
    difficulty,
    recordedAt
  };
}

const mastery: SkillMasteryRecord[] = [
  {
    learnerId: '00000000-0000-4000-8000-000000000001',
    curriculumReleaseId: 'curriculum-v1',
    skillId: 'fretting.clean-tone',
    state: 'stable',
    evidenceCount: 1,
    confidence: 80,
    lastAssessmentId: '00000000-0000-4000-8000-000000000003',
    lastAssessedAt: 100,
    nextReviewAt: 500,
    decisionSource: 'evidence',
    updatedAt: 100
  }
];

describe('buildAdaptivePracticeSnapshot', () => {
  it('prioritises needs-practice, then inconclusive, then due reviews, then unseen skills', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        attempt('a1', 'rhythm.pulse', 'needs_practice', 300),
        attempt('a2', 'ear.intervals', 'inconclusive', 250),
        attempt('a3', 'fretting.clean-tone', 'passed', 100)
      ],
      mastery,
      practiceEvidence: [],
      now: 500
    });
    expect(result.recommendations.map((item) => item.targetId)).toEqual([
      'rhythm.pulse',
      'ear.intervals',
      'fretting.clean-tone'
    ]);
    expect(result.recommendations[0].reasonCodes).toContain(
      'assessment_needs_practice'
    );
    expect(result.recommendations[1].reasonCodes).toContain(
      'assessment_inconclusive'
    );
    expect(result.recommendations[2].reasonCodes).toContain('review_overdue');
  });

  it('does not let a supporting probe supersede whole-skill recommendations or analytics', () => {
    const fullSkillAttempt = attempt(
      'skill-attempt',
      'fretting.clean-tone',
      'needs_practice',
      100
    );
    const supportingProbe = {
      ...attempt('item-probe', 'fretting.clean-tone', 'passed', 200, 100),
      assessmentInstrument: {
        definitionId: 'guitar.standard-tuning-open-pitches',
        definitionVersion: 1,
        scoringRuleVersion: 'exact-pitch-five-of-six-v1',
        itemCount: 1,
        passThreshold: 100,
        decisionScope: 'supporting_probe' as const
      },
      itemEvidence: [
        {
          itemId: 'standard-tuning.string-6-open-pitch',
          response: 'E2',
          outcome: 'correct' as const,
          responseSource: 'learner_selected_option' as const
        }
      ]
    };
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [fullSkillAttempt, supportingProbe],
      mastery: [],
      practiceEvidence: [],
      now: 300
    });
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'fretting.clean-tone'
    );
    const recommendation = result.recommendations.find(
      (item) => item.targetId === 'fretting.clean-tone'
    );
    expect(analytics).toMatchObject({
      assessmentCount: 1,
      latestOutcome: 'needs_practice',
      measuredScoreCount: 0
    });
    expect(recommendation?.reasonCodes).toContain('assessment_needs_practice');
    expect(analytics?.itemEvidenceGroups[0]).toMatchObject({
      decisionScope: 'supporting_probe',
      correctItemCount: 1,
      accuracyPercent: 100
    });
  });

  it('summarises item accuracy per instrument and excludes inconclusive items from its denominator', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        itemAttempt(
          'item-1',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'minor_third',
          'incorrect',
          100
        ),
        itemAttempt(
          'item-2',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'perfect_fifth',
          'correct',
          200
        ),
        itemAttempt(
          'item-3',
          'ear.intervals',
          'interval-recognition.major-third',
          null,
          'inconclusive',
          300
        )
      ],
      mastery: [],
      practiceEvidence: [],
      now: 400
    });
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'ear.intervals'
    );
    expect(analytics).toMatchObject({
      assessmentCount: 0,
      latestOutcome: null,
      itemEvidenceGroups: [
        {
          definitionId: 'guitar.ear-training.interval-recognition',
          definitionVersion: 1,
          scoringRuleVersion: 'exact-interval-choice-v1',
          decisionScope: 'supporting_probe',
          assessmentAttemptCount: 3,
          itemCount: 2,
          correctItemCount: 1,
          incorrectItemCount: 1,
          inconclusiveItemCount: 1,
          answeredItemCount: 2,
          accuracyPercent: 50
        }
      ]
    });
    expect(
      analytics?.itemEvidenceGroups[0].items.find(
        (item) => item.itemId === 'interval-recognition.perfect-fifth'
      )
    ).toMatchObject({
      attemptCount: 2,
      correctCount: 1,
      incorrectCount: 1,
      latestOutcome: 'correct',
      consecutiveIncorrectCount: 0
    });
    expect(
      result.categoryCoverage.find((item) => item.category === 'ear')
    ).toEqual({
      category: 'ear',
      totalSkills: 1,
      assessedSkills: 0,
      coverage: 0
    });
  });

  it('raises focused practice priority after consecutive incorrect outcomes on the same item', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        itemAttempt(
          'miss-1',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'minor_third',
          'incorrect',
          100
        ),
        itemAttempt(
          'miss-2',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'major_third',
          'incorrect',
          200
        )
      ],
      mastery: [],
      practiceEvidence: [],
      now: 300
    });
    const recommendation = result.recommendations.find(
      (item) => item.targetId === 'ear.intervals'
    );
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'ear.intervals'
    );
    expect(recommendation).toMatchObject({
      priority: 85,
      reasonCodes: ['not_yet_assessed', 'repeated_item_incorrect'],
      evidenceType: 'supporting_probe',
      evidenceCount: 2,
      latestEvidenceAt: 200
    });
    expect(recommendation?.explanation).toContain('2 consecutive attempts');
    expect(recommendation?.explanation).toContain(
      'do not establish or change whole-skill mastery'
    );
    expect(analytics).toMatchObject({
      assessmentCount: 0,
      latestOutcome: null,
      itemEvidenceGroups: [
        {
          incorrectItemCount: 2,
          accuracyPercent: 0,
          items: [
            {
              consecutiveIncorrectCount: 2,
              latestOutcome: 'incorrect'
            }
          ]
        }
      ]
    });
  });

  it('resets repeated-incorrect priority after a later correct or inconclusive item response', () => {
    for (const [response, outcome] of [
      ['perfect_fifth', 'correct'],
      [null, 'inconclusive']
    ] as const) {
      const result = buildAdaptivePracticeSnapshot({
        learnerId: '00000000-0000-4000-8000-000000000001',
        curriculumReleaseId: 'curriculum-v1',
        skills,
        attempts: [
          itemAttempt(
            'miss-1',
            'ear.intervals',
            'interval-recognition.perfect-fifth',
            'minor_third',
            'incorrect',
            100
          ),
          itemAttempt(
            'miss-2',
            'ear.intervals',
            'interval-recognition.perfect-fifth',
            'major_third',
            'incorrect',
            200
          ),
          itemAttempt(
            'latest',
            'ear.intervals',
            'interval-recognition.perfect-fifth',
            response,
            outcome,
            300
          )
        ],
        mastery: [],
        practiceEvidence: [],
        now: 400
      });
      const recommendation = result.recommendations.find(
        (item) => item.targetId === 'ear.intervals'
      );
      expect(recommendation?.reasonCodes).toEqual(['not_yet_assessed']);
      expect(recommendation?.priority).toBe(30);
      expect(
        result.skillAnalytics.find((item) => item.skillId === 'ear.intervals')
          ?.itemEvidenceGroups[0].items[0].consecutiveIncorrectCount
      ).toBe(0);
    }
  });

  it('does not let a later response to a different item refresh a repeated-miss signal', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        itemAttempt(
          'miss-1',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'minor_third',
          'incorrect',
          100
        ),
        itemAttempt(
          'miss-2',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'major_third',
          'incorrect',
          200
        ),
        itemAttempt(
          'other-item-correct',
          'ear.intervals',
          'interval-recognition.minor-third',
          'minor_third',
          'correct',
          300
        )
      ],
      mastery: [],
      practiceEvidence: [],
      now: 400
    });
    const recommendation = result.recommendations.find(
      (item) => item.targetId === 'ear.intervals'
    );
    expect(recommendation?.reasonCodes).toContain('repeated_item_incorrect');
    expect(recommendation?.latestEvidenceAt).toBe(200);
  });

  it('does not combine matching item IDs across different instrument versions or scoring rules', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        itemAttempt(
          'version-one',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'minor_third',
          'incorrect',
          100
        ),
        itemAttempt(
          'version-two',
          'ear.intervals',
          'interval-recognition.perfect-fifth',
          'minor_third',
          'incorrect',
          200,
          'guitar.ear-training.interval-recognition',
          'alternate-interval-choice-v2'
        )
      ],
      mastery: [],
      practiceEvidence: [],
      now: 300
    });
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'ear.intervals'
    );
    const recommendation = result.recommendations.find(
      (item) => item.targetId === 'ear.intervals'
    );
    expect(analytics?.itemEvidenceGroups).toHaveLength(2);
    expect(
      analytics?.itemEvidenceGroups.every(
        (group) => group.items[0].consecutiveIncorrectCount === 1
      )
    ).toBe(true);
    expect(recommendation?.reasonCodes).toEqual(['not_yet_assessed']);
    expect(recommendation?.priority).toBe(30);
  });

  it('counts only distinct exercises with exact current authored identity for exposure coverage', () => {
    const linked = (
      id: string,
      lessonId: string,
      authoredExerciseId: string,
      recordedAt: number,
      sessionId = '00000000-0000-4000-8000-000000000002'
    ): PracticeEvidenceRecord => ({
      ...observation(id, 'learner-entered exercise label', 5, recordedAt),
      sessionId,
      curriculumReleaseId: 'curriculum-v1.0.6',
      lessonId,
      authoredExerciseId,
      practiceTaxonomyVersion: '0.1.0',
      repetitions: 100_000,
      cleanRepetitions: 100_000
    });

    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1.0.6',
      skills,
      attempts: [],
      mastery: [],
      practiceEvidence: [
        linked('linked-a1', 'lesson-a', 'exercise-a', 100),
        linked('linked-a2', 'lesson-a', 'exercise-a', 110),
        linked('linked-b', 'lesson-b', 'exercise-b', 120, '00000000-0000-4000-8000-000000000003'),
        observation('legacy-free-text', 'exercise-a', 130, 130),
        {
          ...linked('stale-version', 'lesson-a', 'exercise-a', 140),
          practiceTaxonomyVersion: '0.0.9'
        },
        {
          ...linked('stale-release', 'lesson-a', 'exercise-a', 150),
          curriculumReleaseId: 'curriculum-v1.0.5'
        },
        {
          ...linked('wrong-lesson-pair', 'lesson-other', 'exercise-a', 160)
        },
        {
          ...linked('other-learner', 'lesson-a', 'exercise-a', 170),
          learnerId: '00000000-0000-4000-8000-000000000099'
        }
      ],
      authoredPracticeScopes: [
        {
          lessonId: 'lesson-a',
          exerciseId: 'exercise-a',
          topicIds: ['topic.tuning'],
          techniqueIds: ['technique.strumming'],
          stringNumbers: [1],
          fretPositionIds: ['position.open']
        },
        {
          lessonId: 'lesson-b',
          exerciseId: 'exercise-b',
          topicIds: ['topic.tuning'],
          techniqueIds: [],
          stringNumbers: [],
          fretPositionIds: ['position.open']
        }
      ],
      authoredPracticeDimensions: [
        { category: 'topic', id: 'topic.tuning', label: 'Tuning' },
        {
          category: 'technique',
          id: 'technique.strumming',
          label: 'Strumming'
        },
        { category: 'string', id: '1', label: 'High E' },
        {
          category: 'fret_position',
          id: 'position.open',
          label: 'Open position'
        }
      ],
      practiceTaxonomyVersion: '0.1.0',
      now: 200
    });

    expect(result.practiceExposureCoverage).toEqual([
      {
        category: 'fret_position',
        dimensionId: 'position.open',
        label: 'Open position',
        observedExerciseCount: 2,
        availableExerciseCount: 2,
        observedSessionCount: 2,
        latestObservedAt: 120
      },
      {
        category: 'string',
        dimensionId: '1',
        label: 'High E',
        observedExerciseCount: 1,
        availableExerciseCount: 1,
        observedSessionCount: 1,
        latestObservedAt: 110
      },
      {
        category: 'technique',
        dimensionId: 'technique.strumming',
        label: 'Strumming',
        observedExerciseCount: 1,
        availableExerciseCount: 1,
        observedSessionCount: 1,
        latestObservedAt: 110
      },
      {
        category: 'topic',
        dimensionId: 'topic.tuning',
        label: 'Tuning',
        observedExerciseCount: 2,
        availableExerciseCount: 2,
        observedSessionCount: 2,
        latestObservedAt: 120
      }
    ]);
  });

  it('shows zero recorded exposure without treating it as missing accuracy or mastery evidence', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1.0.6',
      skills,
      attempts: [],
      mastery: [],
      practiceEvidence: [observation('legacy', 'old free text', 5, 100)],
      authoredPracticeScopes: [
        {
          lessonId: 'lesson-a',
          exerciseId: 'exercise-a',
          topicIds: ['topic.tuning'],
          techniqueIds: [],
          stringNumbers: [],
          fretPositionIds: []
        }
      ],
      authoredPracticeDimensions: [
        { category: 'topic', id: 'topic.tuning', label: 'Tuning' }
      ],
      practiceTaxonomyVersion: '0.1.0',
      now: 200
    });
    expect(result.practiceExposureCoverage).toEqual([
      {
        category: 'topic',
        dimensionId: 'topic.tuning',
        label: 'Tuning',
        observedExerciseCount: 0,
        availableExerciseCount: 1,
        observedSessionCount: 0,
        latestObservedAt: null
      }
    ]);
    expect(
      result.skillAnalytics.every(
        (item) =>
          item.accuracyEvidenceStatus === 'insufficient_evidence' &&
          item.measuredScoreMean === null
      )
    ).toBe(true);
  });

  it('does not call self-reported clean repetitions verified accuracy', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [],
      mastery: [],
      practiceEvidence: [
        observation('o1', 'scale-box-1', 4, 100),
        observation('o2', 'scale-box-1', 5, 200)
      ],
      now: 300
    });
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'rhythm.pulse'
    );
    expect(analytics?.accuracyEvidenceStatus).toBe('insufficient_evidence');
    expect(analytics?.measuredScoreMean).toBeNull();
    const exercise = result.recommendations.find(
      (item) => item.targetId === 'scale-box-1'
    );
    expect(exercise?.reasonCodes).toEqual([
      'repeated_self_reported_difficulty'
    ]);
    expect(exercise?.evidenceType).toBe('learner_observation');
  });

  it('uses measured scored attempts only for accuracy and score spread', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        attempt('a1', 'rhythm.pulse', 'passed', 100, 80, 'measured'),
        attempt('a2', 'rhythm.pulse', 'passed', 200, 100, 'measured'),
        attempt('a3', 'rhythm.pulse', 'passed', 300, 20, 'self_reported')
      ],
      mastery: [],
      practiceEvidence: [],
      now: 400
    });
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'rhythm.pulse'
    );
    expect(analytics?.measuredScoreMean).toBe(90);
    expect(analytics?.measuredScoreSpread).toBe(10);
    expect(analytics?.measuredScoreCount).toBe(2);
    expect(analytics?.latestMeasuredScore).toBe(100);
    expect(analytics?.measuredScoreTrend).toBe('insufficient_evidence');
    expect(analytics?.measuredScoreTrendDelta).toBeNull();
    expect(analytics?.accuracyEvidenceStatus).toBe('available');
  });

  it.each([
    { scores: [40, 40, 60, 60], status: 'improving', delta: 20 },
    { scores: [50, 50, 53, 53], status: 'stable', delta: 3 },
    { scores: [90, 90, 70, 70], status: 'declining', delta: -20 }
  ] as const)(
    'classifies measured score direction from the latest four comparable scores',
    ({ scores, status, delta }) => {
      const result = buildAdaptivePracticeSnapshot({
        learnerId: '00000000-0000-4000-8000-000000000001',
        curriculumReleaseId: 'curriculum-v1',
        skills,
        attempts: scores.map((score, index) =>
          attempt(
            `trend-${index}`,
            'rhythm.pulse',
            'passed',
            (index + 1) * 100,
            score,
            'measured'
          )
        ),
        mastery: [],
        practiceEvidence: [],
        now: 1000
      });
      const analytics = result.skillAnalytics.find(
        (item) => item.skillId === 'rhythm.pulse'
      );
      expect(analytics?.measuredScoreTrend).toBe(status);
      expect(analytics?.measuredScoreTrendDelta).toBe(delta);
    }
  );

  it('keeps score summaries within the most recently used assessment kind', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        {
          ...attempt('old-1', 'rhythm.pulse', 'passed', 100, 95),
          assessmentKind: 'checkpoint'
        },
        {
          ...attempt('old-2', 'rhythm.pulse', 'passed', 150, 90),
          assessmentKind: 'checkpoint'
        },
        attempt('new-1', 'rhythm.pulse', 'passed', 200, 50),
        attempt('new-2', 'rhythm.pulse', 'passed', 300, 50),
        attempt('new-3', 'rhythm.pulse', 'passed', 400, 70),
        attempt('new-4', 'rhythm.pulse', 'passed', 500, 70)
      ],
      mastery: [],
      practiceEvidence: [],
      now: 600
    });
    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'rhythm.pulse'
    );
    expect(analytics?.measuredScoreAssessmentKind).toBe('measured');
    expect(analytics?.measuredScoreCount).toBe(4);
    expect(analytics?.measuredScoreMean).toBe(60);
    expect(analytics?.measuredScoreTrend).toBe('improving');
    expect(analytics?.measuredScoreTrendDelta).toBe(20);
  });

  it('distinguishes missing assessment evidence from a poor score and computes topic coverage', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [attempt('a1', 'rhythm.pulse', 'passed', 100, null)],
      mastery: [],
      practiceEvidence: [],
      now: 200
    });
    expect(
      result.skillAnalytics.find((item) => item.skillId === 'ear.intervals')
        ?.accuracyEvidenceStatus
    ).toBe('insufficient_evidence');
    expect(result.categoryCoverage).toEqual([
      { category: 'ear', totalSkills: 1, assessedSkills: 0, coverage: 0 },
      { category: 'rhythm', totalSkills: 1, assessedSkills: 1, coverage: 1 },
      { category: 'technique', totalSkills: 1, assessedSkills: 0, coverage: 0 }
    ]);
  });

  it('uses stable tie-breaking and never recommends an expired review as overdue before its timestamp', () => {
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [],
      mastery: [{ ...mastery[0], nextReviewAt: 501 }],
      practiceEvidence: [],
      now: 500
    });
    expect(result.recommendations.map((item) => item.targetId)).toEqual([
      'ear.intervals',
      'fretting.clean-tone',
      'rhythm.pulse'
    ]);
    expect(
      result.recommendations.every((item) =>
        item.reasonCodes.includes('not_yet_assessed')
      )
    ).toBe(true);
  });

  it('does not mutate the supplied evidence arrays', () => {
    const attempts = [attempt('a1', 'rhythm.pulse', 'needs_practice', 100)];
    const before = structuredClone(attempts);
    buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts,
      mastery: [],
      practiceEvidence: [],
      now: 200
    });
    expect(attempts).toEqual(before);
  });
  it('ignores assessment, mastery and practice evidence owned by another learner or release', () => {
    const otherLearner = '00000000-0000-4000-8000-000000000099';
    const result = buildAdaptivePracticeSnapshot({
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1',
      skills,
      attempts: [
        attempt('a1', 'rhythm.pulse', 'needs_practice', 100),
        {
          ...attempt('a2', 'rhythm.pulse', 'passed', 200),
          learnerId: otherLearner
        },
        {
          ...attempt('a3', 'rhythm.pulse', 'passed', 300),
          curriculumReleaseId: 'curriculum-v2'
        }
      ],
      mastery: [
        ...mastery,
        { ...mastery[0], learnerId: otherLearner, state: 'stable' }
      ],
      practiceEvidence: [
        observation('o1', 'learner-owned-exercise', 4, 100),
        {
          ...observation('o2', 'other-learners-exercise', 5, 200),
          learnerId: otherLearner
        }
      ],
      now: 400
    });

    const analytics = result.skillAnalytics.find(
      (item) => item.skillId === 'rhythm.pulse'
    );
    expect(analytics?.assessmentCount).toBe(1);
    expect(analytics?.latestOutcome).toBe('needs_practice');
    expect(
      result.recommendations.some(
        (item) => item.targetId === 'other-learners-exercise'
      )
    ).toBe(false);
  });
});

describe('resolveAdaptiveRecommendationFeedback', () => {
  const recommendation = {
    id: 'skill:rhythm.pulse',
    targetType: 'skill' as const,
    targetId: 'rhythm.pulse',
    title: 'Practise Pulse',
    priority: 100,
    reasonCodes: ['assessment_needs_practice' as const],
    explanation: 'The latest assessment needs practice.',
    evidenceType: 'assessment' as const,
    evidenceCount: 1,
    latestEvidenceAt: 100
  };

  function feedback(
    action: AdaptiveRecommendationFeedbackRecord['action'],
    correction: AdaptiveRecommendationFeedbackRecord['correction'],
    createdAt: number,
    id = '00000000-0000-4000-8000-000000000010'
  ): AdaptiveRecommendationFeedbackRecord {
    return {
      id,
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1.0.6',
      recommendationId: recommendation.id,
      targetType: 'skill',
      targetId: recommendation.targetId,
      reasonCodes: ['assessment_needs_practice'],
      action,
      correction,
      createdAt
    };
  }

  it('hides dismissed recommendations until newer source evidence exists', () => {
    const dismissed = feedback('dismiss', null, 200);
    expect(
      resolveAdaptiveRecommendationFeedback({
        recommendations: [recommendation],
        feedback: [dismissed]
      })
    ).toEqual([]);

    expect(
      resolveAdaptiveRecommendationFeedback({
        recommendations: [{ ...recommendation, latestEvidenceAt: 201 }],
        feedback: [dismissed]
      })
    ).toEqual([
      {
        recommendation: { ...recommendation, latestEvidenceAt: 201 },
        feedback: null
      }
    ]);
  });

  it('hides confident or irrelevant corrections without changing the recommendation model', () => {
    for (const correction of ['already_confident', 'not_relevant'] as const) {
      expect(
        resolveAdaptiveRecommendationFeedback({
          recommendations: [recommendation],
          feedback: [feedback('correct', correction, 200)]
        })
      ).toEqual([]);
    }
    expect(recommendation.priority).toBe(100);
    expect(recommendation.reasonCodes).toEqual(['assessment_needs_practice']);
  });

  it('keeps too-difficult recommendations visible with the latest correction', () => {
    const latest = feedback('correct', 'too_difficult', 200);
    expect(
      resolveAdaptiveRecommendationFeedback({
        recommendations: [recommendation],
        feedback: [latest]
      })
    ).toEqual([{ recommendation, feedback: latest }]);
  });

  it('uses deterministic latest-feedback ordering when timestamps tie', () => {
    const older = feedback(
      'dismiss',
      null,
      200,
      '00000000-0000-4000-8000-000000000010'
    );
    const newer = feedback(
      'correct',
      'too_difficult',
      200,
      '00000000-0000-4000-8000-000000000011'
    );
    expect(
      resolveAdaptiveRecommendationFeedback({
        recommendations: [recommendation],
        feedback: [newer, older]
      })[0].feedback
    ).toEqual(newer);
  });
});
