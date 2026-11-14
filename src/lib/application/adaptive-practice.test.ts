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
    expect(analytics?.accuracyEvidenceStatus).toBe('available');
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
    ).toEqual([{ recommendation: { ...recommendation, latestEvidenceAt: 201 }, feedback: null }]);
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
    const older = feedback('dismiss', null, 200, '00000000-0000-4000-8000-000000000010');
    const newer = feedback('correct', 'too_difficult', 200, '00000000-0000-4000-8000-000000000011');
    expect(
      resolveAdaptiveRecommendationFeedback({
        recommendations: [recommendation],
        feedback: [newer, older]
      })[0].feedback
    ).toEqual(newer);
  });
});
