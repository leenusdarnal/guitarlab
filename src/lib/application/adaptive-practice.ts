import type {
  AssessmentAttemptRecord,
  AdaptiveRecommendationFeedbackRecord,
  PracticeEvidenceRecord,
  SkillMasteryRecord,
  SkillRecord
} from '../repositories/contracts';

export type AdaptiveReasonCode =
  | 'assessment_needs_practice'
  | 'assessment_inconclusive'
  | 'review_overdue'
  | 'not_yet_assessed'
  | 'repeated_self_reported_difficulty';

export type AdaptivePracticeRecommendation = {
  id: string;
  targetType: 'skill' | 'exercise';
  targetId: string;
  title: string;
  priority: number;
  reasonCodes: AdaptiveReasonCode[];
  explanation: string;
  evidenceType: 'assessment' | 'learner_observation' | 'missing';
  evidenceCount: number;
  latestEvidenceAt: number | null;
};

export type SkillAnalytics = {
  skillId: string;
  category: string;
  assessmentCount: number;
  latestOutcome: AssessmentAttemptRecord['outcome'] | null;
  measuredScoreMean: number | null;
  measuredScoreSpread: number | null;
  accuracyEvidenceStatus: 'available' | 'insufficient_evidence';
};

export type CategoryCoverage = {
  category: string;
  totalSkills: number;
  assessedSkills: number;
  coverage: number;
};

export type AdaptivePracticeSnapshot = {
  recommendations: AdaptivePracticeRecommendation[];
  skillAnalytics: SkillAnalytics[];
  categoryCoverage: CategoryCoverage[];
  assessedSkillCount: number;
  totalSkillCount: number;
};

function orderedAttempts(
  attempts: readonly AssessmentAttemptRecord[]
): AssessmentAttemptRecord[] {
  return [...attempts].sort(
    (a, b) =>
      a.assessedAt - b.assessedAt ||
      a.recordedAt - b.recordedAt ||
      a.id.localeCompare(b.id)
  );
}

function mean(values: readonly number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

function standardDeviation(values: readonly number[]): number | null {
  const average = mean(values);
  if (average === null) return null;
  return Math.sqrt(
    values.reduce((sum, value) => sum + (value - average) ** 2, 0) /
      values.length
  );
}

/**
 * Build a deterministic, read-only adaptive practice view from active-learner
 * records. It never writes mastery, changes assessment history, or treats
 * practice duration/repetition counts as correctness.
 */
export function buildAdaptivePracticeSnapshot(input: {
  learnerId: string;
  curriculumReleaseId: string;
  skills: readonly SkillRecord[];
  attempts: readonly AssessmentAttemptRecord[];
  mastery: readonly SkillMasteryRecord[];
  practiceEvidence: readonly PracticeEvidenceRecord[];
  now: number;
}): AdaptivePracticeSnapshot {
  const skillById = new Map(input.skills.map((skill) => [skill.id, skill]));
  const scopedAttempts = input.attempts.filter(
    (attempt) =>
      attempt.learnerId === input.learnerId &&
      attempt.curriculumReleaseId === input.curriculumReleaseId
  );
  const scopedMastery = input.mastery.filter(
    (record) =>
      record.learnerId === input.learnerId &&
      record.curriculumReleaseId === input.curriculumReleaseId
  );
  const scopedPracticeEvidence = input.practiceEvidence.filter(
    (record) => record.learnerId === input.learnerId
  );
  const attemptsBySkill = new Map<string, AssessmentAttemptRecord[]>();
  for (const attempt of scopedAttempts) {
    if (!skillById.has(attempt.skillId)) continue;
    const list = attemptsBySkill.get(attempt.skillId) ?? [];
    list.push(attempt);
    attemptsBySkill.set(attempt.skillId, list);
  }

  const masteryBySkill = new Map(
    scopedMastery.map((record) => [record.skillId, record])
  );
  const recommendations: AdaptivePracticeRecommendation[] = [];
  const skillAnalytics: SkillAnalytics[] = [];

  for (const skill of [...input.skills].sort((a, b) =>
    a.id.localeCompare(b.id)
  )) {
    const attempts = orderedAttempts(attemptsBySkill.get(skill.id) ?? []);
    const latest = attempts.at(-1) ?? null;
    const currentMastery = masteryBySkill.get(skill.id) ?? null;

    const measuredScores = attempts
      .filter(
        (attempt) =>
          attempt.evidenceType === 'measured' && attempt.score !== null
      )
      .map((attempt) => attempt.score as number);
    skillAnalytics.push({
      skillId: skill.id,
      category: skill.category,
      assessmentCount: attempts.length,
      latestOutcome: latest?.outcome ?? null,
      measuredScoreMean: mean(measuredScores),
      measuredScoreSpread: standardDeviation(measuredScores),
      accuracyEvidenceStatus: measuredScores.length
        ? 'available'
        : 'insufficient_evidence'
    });

    const reasonCodes: AdaptiveReasonCode[] = [];
    let priority = 0;
    let explanation = '';
    if (latest?.outcome === 'needs_practice') {
      reasonCodes.push('assessment_needs_practice');
      priority = 100;
      explanation =
        'Your latest assessment identified this skill as needing more practice.';
    } else if (latest?.outcome === 'inconclusive') {
      reasonCodes.push('assessment_inconclusive');
      priority = 80;
      explanation =
        'Your latest assessment was inconclusive; a focused check can gather clearer evidence.';
    } else if (
      currentMastery?.state === 'stable' &&
      currentMastery.nextReviewAt !== null &&
      currentMastery.nextReviewAt <= input.now
    ) {
      reasonCodes.push('review_overdue');
      priority = 70;
      explanation =
        'This previously assessed skill has reached its review date.';
    } else if (!latest) {
      reasonCodes.push('not_yet_assessed');
      priority = 30;
      explanation =
        'There is no assessment evidence for this skill yet; start with a short baseline check.';
    }

    if (reasonCodes.length) {
      recommendations.push({
        id: `skill:${skill.id}`,
        targetType: 'skill',
        targetId: skill.id,
        title: `Practise ${skill.displayName}`,
        priority,
        reasonCodes,
        explanation,
        evidenceType: latest ? 'assessment' : 'missing',
        evidenceCount: attempts.length,
        latestEvidenceAt: latest?.assessedAt ?? null
      });
    }
  }

  const observationsByExercise = new Map<string, PracticeEvidenceRecord[]>();
  for (const observation of scopedPracticeEvidence) {
    const list = observationsByExercise.get(observation.exerciseId) ?? [];
    list.push(observation);
    observationsByExercise.set(observation.exerciseId, list);
  }
  for (const [exerciseId, observations] of observationsByExercise) {
    const ordered = [...observations].sort(
      (a, b) => a.recordedAt - b.recordedAt || a.id.localeCompare(b.id)
    );
    const repeatedDifficulty = ordered.filter(
      (observation) =>
        observation.difficulty !== null && observation.difficulty >= 4
    );
    if (repeatedDifficulty.length < 2) continue;
    const latest = ordered.at(-1)!;
    recommendations.push({
      id: `exercise:${exerciseId}`,
      targetType: 'exercise',
      targetId: exerciseId,
      title: `Revisit exercise ${exerciseId}`,
      priority: 45,
      reasonCodes: ['repeated_self_reported_difficulty'],
      explanation:
        'You have recorded high difficulty for this exercise more than once. Treat this as a pacing signal, not a correctness score.',
      evidenceType: 'learner_observation',
      evidenceCount: repeatedDifficulty.length,
      latestEvidenceAt: latest.recordedAt
    });
  }

  recommendations.sort(
    (a, b) =>
      b.priority - a.priority ||
      (a.latestEvidenceAt ?? Number.MAX_SAFE_INTEGER) -
        (b.latestEvidenceAt ?? Number.MAX_SAFE_INTEGER) ||
      a.targetId.localeCompare(b.targetId)
  );

  const categoryTotals = new Map<string, { total: number; assessed: number }>();
  for (const skill of input.skills) {
    const entry = categoryTotals.get(skill.category) ?? {
      total: 0,
      assessed: 0
    };
    entry.total += 1;
    if ((attemptsBySkill.get(skill.id) ?? []).length) entry.assessed += 1;
    categoryTotals.set(skill.category, entry);
  }
  const categoryCoverage = [...categoryTotals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, counts]) => ({
      category,
      totalSkills: counts.total,
      assessedSkills: counts.assessed,
      coverage: counts.total ? counts.assessed / counts.total : 0
    }));

  const assessedSkillCount = skillAnalytics.filter(
    (item) => item.assessmentCount > 0
  ).length;
  return {
    recommendations,
    skillAnalytics,
    categoryCoverage,
    assessedSkillCount,
    totalSkillCount: input.skills.length
  };
}


export type AdaptiveRecommendationFeedbackViewItem = {
  recommendation: AdaptivePracticeRecommendation;
  feedback: AdaptiveRecommendationFeedbackRecord | null;
};

/**
 * Resolve local learner feedback against the latest recommendation evidence.
 * A new assessment/observation after feedback makes the recommendation
 * eligible to return. "Too difficult" stays visible with a simplification cue.
 */
export function resolveAdaptiveRecommendationFeedback(input: {
  recommendations: readonly AdaptivePracticeRecommendation[];
  feedback: readonly AdaptiveRecommendationFeedbackRecord[];
}): AdaptiveRecommendationFeedbackViewItem[] {
  const latestByRecommendation = new Map<
    string,
    AdaptiveRecommendationFeedbackRecord
  >();

  for (const record of input.feedback) {
    const current = latestByRecommendation.get(record.recommendationId);
    if (
      !current ||
      record.createdAt > current.createdAt ||
      (record.createdAt === current.createdAt && record.id > current.id)
    ) {
      latestByRecommendation.set(record.recommendationId, record);
    }
  }

  return input.recommendations.flatMap((recommendation) => {
    const stored = latestByRecommendation.get(recommendation.id) ?? null;
    const feedback =
      stored &&
      recommendation.latestEvidenceAt !== null &&
      recommendation.latestEvidenceAt > stored.createdAt
        ? null
        : stored;

    const hidesRecommendation =
      feedback?.action === 'dismiss' ||
      (feedback?.action === 'correct' &&
        feedback.correction !== 'too_difficult');

    return hidesRecommendation
      ? []
      : [{ recommendation, feedback }];
  });
}
