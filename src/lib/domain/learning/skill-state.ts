import type {
  AssessmentAttemptRecord,
  SkillMasteryRecord
} from '../../repositories/contracts';

export type SkillStateExplanation = {
  state: SkillMasteryRecord['state'];
  reason: string;
  evidenceCount: number;
  latestOutcome: AssessmentAttemptRecord['outcome'] | null;
  latestAssessedAt: number | null;
  nextReviewAt: number | null;
  rule:
    | 'no-assessments'
    | 'latest-passed'
    | 'latest-needs-practice'
    | 'latest-inconclusive'
    | 'review-date-reached';
};

/**
 * Explain the evidence-based skill-state suggestion without writing learner data.
 *
 * Rules are deliberately conservative and deterministic:
 * - no assessment means not_started;
 * - the latest passed attempt suggests stable;
 * - needs_practice suggests practising;
 * - inconclusive suggests learning;
 * - an existing stable state whose review date has arrived suggests review_due.
 *
 * Practice duration, lesson completion and self-reported repetitions are not
 * assessment outcomes and are never inputs to this decision.
 */
export function explainSkillState(input: {
  attempts: readonly AssessmentAttemptRecord[];
  current: SkillMasteryRecord | null;
  now: number;
}): SkillStateExplanation {
  const attempts = [...input.attempts].sort(
    (left, right) =>
      left.assessedAt - right.assessedAt ||
      left.recordedAt - right.recordedAt ||
      left.id.localeCompare(right.id)
  );
  const latest = attempts.at(-1) ?? null;
  const nextReviewAt = input.current?.nextReviewAt ?? null;

  if (
    input.current?.state === 'stable' &&
    nextReviewAt !== null &&
    nextReviewAt <= input.now
  ) {
    return {
      state: 'review_due',
      reason:
        'Your review date has arrived. Recheck this skill to confirm it still feels reliable.',
      evidenceCount: attempts.length,
      latestOutcome: latest?.outcome ?? null,
      latestAssessedAt: latest?.assessedAt ?? null,
      nextReviewAt,
      rule: 'review-date-reached'
    };
  }

  if (!latest) {
    return {
      state: 'not_started',
      reason:
        'No assessment has been recorded for this skill yet. Practice activity alone does not establish mastery.',
      evidenceCount: 0,
      latestOutcome: null,
      latestAssessedAt: null,
      nextReviewAt,
      rule: 'no-assessments'
    };
  }

  if (latest.outcome === 'passed') {
    return {
      state: 'stable',
      reason:
        'The latest assessment was passed. This is an evidence-based suggestion, not a permanent or guaranteed mastery claim.',
      evidenceCount: attempts.length,
      latestOutcome: latest.outcome,
      latestAssessedAt: latest.assessedAt,
      nextReviewAt,
      rule: 'latest-passed'
    };
  }

  if (latest.outcome === 'needs_practice') {
    return {
      state: 'practising',
      reason:
        'The latest assessment identified something to practise before checking this skill again.',
      evidenceCount: attempts.length,
      latestOutcome: latest.outcome,
      latestAssessedAt: latest.assessedAt,
      nextReviewAt,
      rule: 'latest-needs-practice'
    };
  }

  return {
    state: 'learning',
    reason:
        'The latest assessment was inconclusive, so there is not enough evidence to call this skill stable.',
    evidenceCount: attempts.length,
    latestOutcome: latest.outcome,
    latestAssessedAt: latest.assessedAt,
    nextReviewAt,
    rule: 'latest-inconclusive'
  };
}
