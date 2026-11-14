import type {
  AssessmentAttemptRecord,
  AdaptiveRecommendationFeedbackRecord,
  PracticeEvidenceRecord,
  SkillMasteryRecord,
  SkillRecord
} from '../repositories/contracts';
import type {
  AuthoredPracticeDimension,
  AuthoredPracticeScope
} from './practice-taxonomy';

type PracticeExposureScope = Pick<
  AuthoredPracticeScope,
  | 'lessonId'
  | 'exerciseId'
  | 'topicIds'
  | 'techniqueIds'
  | 'stringNumbers'
  | 'fretPositionIds'
>;

export type AdaptiveReasonCode =
  | 'assessment_needs_practice'
  | 'assessment_inconclusive'
  | 'review_overdue'
  | 'not_yet_assessed'
  | 'repeated_self_reported_difficulty'
  | 'repeated_item_incorrect';

export type AdaptivePracticeRecommendation = {
  id: string;
  targetType: 'skill' | 'exercise';
  targetId: string;
  title: string;
  priority: number;
  reasonCodes: AdaptiveReasonCode[];
  explanation: string;
  evidenceType:
    'assessment' | 'supporting_probe' | 'learner_observation' | 'missing';
  evidenceCount: number;
  latestEvidenceAt: number | null;
};

export type ItemEvidenceItemAnalytics = {
  itemId: string;
  attemptCount: number;
  correctCount: number;
  incorrectCount: number;
  inconclusiveCount: number;
  latestOutcome: 'correct' | 'incorrect' | 'inconclusive';
  consecutiveIncorrectCount: number;
  latestEvidenceAt: number;
};

export type ItemEvidenceGroupAnalytics = {
  definitionId: string;
  definitionVersion: number;
  scoringRuleVersion: string;
  decisionScope: 'skill_level' | 'supporting_probe';
  assessmentAttemptCount: number;
  itemCount: number;
  correctItemCount: number;
  incorrectItemCount: number;
  inconclusiveItemCount: number;
  answeredItemCount: number;
  accuracyPercent: number | null;
  latestEvidenceAt: number;
  items: ItemEvidenceItemAnalytics[];
};

export type SkillAnalytics = {
  skillId: string;
  displayName: string;
  category: string;
  assessmentCount: number;
  latestOutcome: AssessmentAttemptRecord['outcome'] | null;
  measuredScoreCount: number;
  measuredScoreAssessmentKind: AssessmentAttemptRecord['assessmentKind'] | null;
  latestMeasuredScore: number | null;
  measuredScoreMean: number | null;
  measuredScoreSpread: number | null;
  measuredScoreTrend:
    'improving' | 'stable' | 'declining' | 'insufficient_evidence';
  measuredScoreTrendDelta: number | null;
  accuracyEvidenceStatus: 'available' | 'insufficient_evidence';
  itemEvidenceGroups: ItemEvidenceGroupAnalytics[];
};

export type CategoryCoverage = {
  category: string;
  totalSkills: number;
  assessedSkills: number;
  coverage: number;
};

export type PracticeExposureCoverage = {
  category: AuthoredPracticeDimension['category'];
  dimensionId: string;
  label: string;
  observedExerciseCount: number;
  availableExerciseCount: number;
  observedSessionCount: number;
  latestObservedAt: number | null;
};

export type AdaptivePracticeSnapshot = {
  recommendations: AdaptivePracticeRecommendation[];
  skillAnalytics: SkillAnalytics[];
  categoryCoverage: CategoryCoverage[];
  practiceExposureCoverage: PracticeExposureCoverage[];
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
 * Compare the latest four scores from one assessment kind. Two scores from
 * each half reduce overreaction to a single result; a five-point threshold
 * keeps tiny score fluctuations from being presented as a meaningful trend.
 */
function summariseMeasuredScoreTrend(scores: readonly number[]): {
  status: 'improving' | 'stable' | 'declining' | 'insufficient_evidence';
  delta: number | null;
} {
  if (scores.length < 4) {
    return { status: 'insufficient_evidence', delta: null };
  }

  const comparison = scores.slice(-4);
  const earlierMean = mean(comparison.slice(0, 2));
  const recentMean = mean(comparison.slice(2));
  if (earlierMean === null || recentMean === null) {
    return { status: 'insufficient_evidence', delta: null };
  }

  const delta = recentMean - earlierMean;
  return {
    status: delta >= 5 ? 'improving' : delta <= -5 ? 'declining' : 'stable',
    delta
  };
}

/**
 * Summarise item outcomes only within the same authored instrument definition,
 * version and scoring rule. Inconclusive answers are retained as counts but
 * excluded from the accuracy denominator. A later correct or inconclusive
 * response resets an item's consecutive-incorrect streak.
 */
function buildItemEvidenceGroups(
  attempts: readonly AssessmentAttemptRecord[]
): ItemEvidenceGroupAnalytics[] {
  type ItemEvent = {
    attemptId: string;
    outcome: 'correct' | 'incorrect' | 'inconclusive';
    assessedAt: number;
    recordedAt: number;
  };
  type GroupAccumulator = {
    definitionId: string;
    definitionVersion: number;
    scoringRuleVersion: string;
    decisionScope: 'skill_level' | 'supporting_probe';
    attemptIds: Set<string>;
    latestEvidenceAt: number;
    items: Map<string, ItemEvent[]>;
  };

  const groups = new Map<string, GroupAccumulator>();
  for (const attempt of orderedAttempts(attempts)) {
    const instrument = attempt.assessmentInstrument;
    if (!instrument || !attempt.itemEvidence?.length) continue;

    const key = JSON.stringify([
      instrument.definitionId,
      instrument.definitionVersion,
      instrument.scoringRuleVersion,
      instrument.decisionScope
    ]);
    let group = groups.get(key);
    if (!group) {
      group = {
        definitionId: instrument.definitionId,
        definitionVersion: instrument.definitionVersion,
        scoringRuleVersion: instrument.scoringRuleVersion,
        decisionScope: instrument.decisionScope,
        attemptIds: new Set<string>(),
        latestEvidenceAt: attempt.assessedAt,
        items: new Map<string, ItemEvent[]>()
      };
      groups.set(key, group);
    }

    group.attemptIds.add(attempt.id);
    group.latestEvidenceAt = Math.max(
      group.latestEvidenceAt,
      attempt.assessedAt
    );
    for (const item of attempt.itemEvidence) {
      const events = group.items.get(item.itemId) ?? [];
      events.push({
        attemptId: attempt.id,
        outcome: item.outcome,
        assessedAt: attempt.assessedAt,
        recordedAt: attempt.recordedAt
      });
      group.items.set(item.itemId, events);
    }
  }

  return [...groups.values()]
    .map((group) => {
      const items = [...group.items.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([itemId, events]) => {
          const ordered = [...events].sort(
            (left, right) =>
              left.assessedAt - right.assessedAt ||
              left.recordedAt - right.recordedAt ||
              left.attemptId.localeCompare(right.attemptId)
          );
          const latest = ordered.at(-1)!;
          let consecutiveIncorrectCount = 0;
          for (let index = ordered.length - 1; index >= 0; index -= 1) {
            if (ordered[index].outcome !== 'incorrect') break;
            consecutiveIncorrectCount += 1;
          }

          return {
            itemId,
            attemptCount: ordered.length,
            correctCount: ordered.filter((event) => event.outcome === 'correct')
              .length,
            incorrectCount: ordered.filter(
              (event) => event.outcome === 'incorrect'
            ).length,
            inconclusiveCount: ordered.filter(
              (event) => event.outcome === 'inconclusive'
            ).length,
            latestOutcome: latest.outcome,
            consecutiveIncorrectCount,
            latestEvidenceAt: latest.assessedAt
          };
        });
      const correctItemCount = items.reduce(
        (sum, item) => sum + item.correctCount,
        0
      );
      const incorrectItemCount = items.reduce(
        (sum, item) => sum + item.incorrectCount,
        0
      );
      const inconclusiveItemCount = items.reduce(
        (sum, item) => sum + item.inconclusiveCount,
        0
      );
      const answeredItemCount = correctItemCount + incorrectItemCount;

      return {
        definitionId: group.definitionId,
        definitionVersion: group.definitionVersion,
        scoringRuleVersion: group.scoringRuleVersion,
        decisionScope: group.decisionScope,
        assessmentAttemptCount: group.attemptIds.size,
        itemCount: items.length,
        correctItemCount,
        incorrectItemCount,
        inconclusiveItemCount,
        answeredItemCount,
        accuracyPercent:
          answeredItemCount > 0
            ? (correctItemCount / answeredItemCount) * 100
            : null,
        latestEvidenceAt: group.latestEvidenceAt,
        items
      };
    })
    .sort(
      (left, right) =>
        left.definitionId.localeCompare(right.definitionId) ||
        left.definitionVersion - right.definitionVersion ||
        left.scoringRuleVersion.localeCompare(right.scoringRuleVersion) ||
        left.decisionScope.localeCompare(right.decisionScope)
    );
}

/**
 * Count distinct authored exercises with at least one linked observation.
 * The session's exact release/lesson/exercise/taxonomy identity is required;
 * legacy free-text records, stale taxonomy versions and unmatched IDs are
 * deliberately excluded. Repetitions and self-reported difficulty do not
 * increase exposure counts and never become correctness or mastery signals.
 */
function buildPracticeExposureCoverage(input: {
  learnerId: string;
  curriculumReleaseId: string;
  taxonomyVersion: string | null;
  practiceEvidence: readonly PracticeEvidenceRecord[];
  practiceScopes: readonly PracticeExposureScope[];
  dimensions: readonly AuthoredPracticeDimension[];
}): PracticeExposureCoverage[] {
  if (!input.taxonomyVersion || input.practiceScopes.length === 0) return [];

  const keyFor = (lessonId: string, exerciseId: string) =>
    JSON.stringify([lessonId, exerciseId]);
  const scopesByKey = new Map(
    input.practiceScopes.map((scope) => [
      keyFor(scope.lessonId, scope.exerciseId),
      scope
    ])
  );
  const observedByScope = new Map<
    string,
    { sessionIds: Set<string>; latestObservedAt: number }
  >();

  for (const record of input.practiceEvidence) {
    if (
      record.learnerId !== input.learnerId ||
      record.curriculumReleaseId !== input.curriculumReleaseId ||
      record.practiceTaxonomyVersion !== input.taxonomyVersion ||
      !record.lessonId ||
      !record.authoredExerciseId
    ) {
      continue;
    }

    const key = keyFor(record.lessonId, record.authoredExerciseId);
    if (!scopesByKey.has(key)) continue;

    const current = observedByScope.get(key) ?? {
      sessionIds: new Set<string>(),
      latestObservedAt: record.recordedAt
    };
    current.sessionIds.add(record.sessionId);
    current.latestObservedAt = Math.max(
      current.latestObservedAt,
      record.recordedAt
    );
    observedByScope.set(key, current);
  }

  return input.dimensions.flatMap((dimension) => {
    const matchingScopes = input.practiceScopes.filter((scope) => {
      switch (dimension.category) {
        case 'topic':
          return scope.topicIds.includes(dimension.id);
        case 'technique':
          return scope.techniqueIds.includes(dimension.id);
        case 'string':
          return scope.stringNumbers.includes(Number(dimension.id));
        case 'fret_position':
          return scope.fretPositionIds.includes(dimension.id);
      }
    });
    if (matchingScopes.length === 0) return [];

    const observed = matchingScopes.flatMap((scope) => {
      const record = observedByScope.get(
        keyFor(scope.lessonId, scope.exerciseId)
      );
      return record ? [record] : [];
    });
    const sessionIds = new Set(
      observed.flatMap((record) => [...record.sessionIds])
    );

    return [
      {
        category: dimension.category,
        dimensionId: dimension.id,
        label: dimension.label,
        observedExerciseCount: observed.length,
        availableExerciseCount: matchingScopes.length,
        observedSessionCount: sessionIds.size,
        latestObservedAt:
          observed.length > 0
            ? Math.max(...observed.map((record) => record.latestObservedAt))
            : null
      }
    ];
  });
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
  authoredPracticeScopes?: readonly PracticeExposureScope[];
  authoredPracticeDimensions?: readonly AuthoredPracticeDimension[];
  practiceTaxonomyVersion?: string | null;
  now: number;
}): AdaptivePracticeSnapshot {
  const skillById = new Map(input.skills.map((skill) => [skill.id, skill]));
  const scopedLearnerAttempts = input.attempts.filter(
    (attempt) =>
      attempt.learnerId === input.learnerId &&
      attempt.curriculumReleaseId === input.curriculumReleaseId &&
      skillById.has(attempt.skillId)
  );
  const scopedAttempts = scopedLearnerAttempts.filter(
    (attempt) =>
      attempt.assessmentInstrument?.decisionScope !== 'supporting_probe'
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

  const itemEvidenceAttemptsBySkill = new Map<
    string,
    AssessmentAttemptRecord[]
  >();
  for (const attempt of scopedLearnerAttempts) {
    if (!attempt.assessmentInstrument || !attempt.itemEvidence?.length)
      continue;
    const list = itemEvidenceAttemptsBySkill.get(attempt.skillId) ?? [];
    list.push(attempt);
    itemEvidenceAttemptsBySkill.set(attempt.skillId, list);
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
    const itemEvidenceGroups = buildItemEvidenceGroups(
      itemEvidenceAttemptsBySkill.get(skill.id) ?? []
    );

    const measuredAttempts = attempts.filter(
      (attempt) => attempt.evidenceType === 'measured' && attempt.score !== null
    );
    // Scores from different assessment kinds may not be comparable. Use only
    // the most recently used kind for this skill's score summaries and trend.
    const measuredScoreAssessmentKind =
      measuredAttempts.at(-1)?.assessmentKind ?? null;
    const comparableMeasuredAttempts = measuredScoreAssessmentKind
      ? measuredAttempts.filter(
          (attempt) => attempt.assessmentKind === measuredScoreAssessmentKind
        )
      : [];
    const measuredScores = comparableMeasuredAttempts.map(
      (attempt) => attempt.score as number
    );
    const scoreTrend = summariseMeasuredScoreTrend(measuredScores);
    skillAnalytics.push({
      skillId: skill.id,
      displayName: skill.displayName,
      category: skill.category,
      assessmentCount: attempts.length,
      latestOutcome: latest?.outcome ?? null,
      measuredScoreCount: measuredScores.length,
      measuredScoreAssessmentKind,
      latestMeasuredScore: measuredScores.at(-1) ?? null,
      measuredScoreMean: mean(measuredScores),
      measuredScoreSpread: standardDeviation(measuredScores),
      measuredScoreTrend: scoreTrend.status,
      measuredScoreTrendDelta: scoreTrend.delta,
      accuracyEvidenceStatus: measuredScores.length
        ? 'available'
        : 'insufficient_evidence',
      itemEvidenceGroups
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
        'There is no whole-skill assessment evidence for this skill yet; item-level probes provide only a focused view.';
    }

    const repeatedIncorrectItems = itemEvidenceGroups.flatMap((group) =>
      group.items
        .filter((item) => item.consecutiveIncorrectCount >= 2)
        .map((item) => ({ group, item }))
    );
    const supportingProbeAttempts = (
      itemEvidenceAttemptsBySkill.get(skill.id) ?? []
    ).filter(
      (attempt) =>
        attempt.assessmentInstrument?.decisionScope === 'supporting_probe'
    );
    const supportingProbeCount = supportingProbeAttempts.length;
    const latestItemEvidenceAt = itemEvidenceGroups.reduce(
      (latestAt, group) => Math.max(latestAt, group.latestEvidenceAt),
      0
    );
    const latestRepeatedItemEvidenceAt =
      repeatedIncorrectItems.length > 0
        ? Math.max(
            ...repeatedIncorrectItems.map(({ item }) => item.latestEvidenceAt)
          )
        : latestItemEvidenceAt;

    if (repeatedIncorrectItems.length > 0) {
      const repeatedCount = repeatedIncorrectItems.length;
      const longestStreak = Math.max(
        ...repeatedIncorrectItems.map(
          ({ item }) => item.consecutiveIncorrectCount
        )
      );
      reasonCodes.push('repeated_item_incorrect');
      priority = Math.max(priority, 85);
      const repeatedExplanation =
        repeatedCount === 1
          ? `The same scored item has been answered incorrectly in ${longestStreak} consecutive attempts.`
          : `The same ${repeatedCount} scored items have been answered incorrectly in consecutive attempts.`;
      const safetyExplanation =
        'Use this as a focused drill signal only; supporting item probes do not establish or change whole-skill mastery.';
      explanation = explanation
        ? `${explanation} ${repeatedExplanation} ${safetyExplanation}`
        : `${repeatedExplanation} ${safetyExplanation}`;
    }

    if (reasonCodes.length) {
      const evidenceType = latest
        ? 'assessment'
        : supportingProbeCount > 0
          ? 'supporting_probe'
          : 'missing';
      recommendations.push({
        id: `skill:${skill.id}`,
        targetType: 'skill',
        targetId: skill.id,
        title: `Practise ${skill.displayName}`,
        priority,
        reasonCodes,
        explanation,
        evidenceType,
        evidenceCount: latest ? attempts.length : supportingProbeCount,
        latestEvidenceAt:
          Math.max(latest?.assessedAt ?? 0, latestRepeatedItemEvidenceAt) ||
          null
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
  const practiceExposureCoverage = buildPracticeExposureCoverage({
    learnerId: input.learnerId,
    curriculumReleaseId: input.curriculumReleaseId,
    taxonomyVersion: input.practiceTaxonomyVersion ?? null,
    practiceEvidence: scopedPracticeEvidence,
    practiceScopes: input.authoredPracticeScopes ?? [],
    dimensions: input.authoredPracticeDimensions ?? []
  });
  return {
    recommendations,
    skillAnalytics,
    categoryCoverage,
    practiceExposureCoverage,
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

    return hidesRecommendation ? [] : [{ recommendation, feedback }];
  });
}
