import { describe, expect, it } from 'vitest';
import { buildSkillProgressOverview } from './skill-progress-overview';
import type {
  AssessmentAttemptRecord,
  SkillMasteryRecord,
  SkillRecord
} from '../repositories/contracts';

const skill: SkillRecord = {
  id: 'fretboard.natural-notes',
  category: 'fretboard',
  displayName: 'Natural notes on the fretboard'
};

function attempt(
  outcome: AssessmentAttemptRecord['outcome'],
  assessedAt: number
): AssessmentAttemptRecord {
  return {
    id: `00000000-0000-4000-8000-${String(assessedAt).padStart(12, '0')}`,
    learnerId: '00000000-0000-4000-8000-000000000001',
    curriculumReleaseId: 'curriculum-v1.0.6',
    skillId: skill.id,
    lessonId: null,
    assessmentKind: 'measured',
    evidenceType: 'measured',
    outcome,
    score: outcome === 'passed' ? 90 : outcome === 'needs_practice' ? 40 : null,
    evidenceSummary: null,
    evidence: {},
    assessedAt,
    recordedAt: assessedAt
  };
}

function build(input: {
  attempts?: AssessmentAttemptRecord[];
  mastery?: SkillMasteryRecord[];
}) {
  return buildSkillProgressOverview({
    skills: [skill],
    mastery: input.mastery ?? [],
    attempts: input.attempts ?? [],
    activeReleaseId: 'curriculum-v1.0.6',
    now: 100
  })[0];
}

describe('skill progress overview', () => {
  it('shows every catalogue skill as not assessed without fabricating mastery', () => {
    const result = build({});

    expect(result.skill).toEqual(skill);
    expect(result.mastery).toBeNull();
    expect(result.explanation.state).toBe('not_started');
    expect(result.explanation.evidenceCount).toBe(0);
    expect(result.explanation.latestOutcome).toBeNull();
  });

  it('keeps inconclusive evidence distinct from a poor result', () => {
    const result = build({ attempts: [attempt('inconclusive', 50)] });

    expect(result.explanation.state).toBe('learning');
    expect(result.explanation.reason).toContain('inconclusive');
    expect(result.explanation.evidenceCount).toBe(1);
  });

  it('uses the latest needs-practice assessment without calling it failed', () => {
    const result = build({ attempts: [attempt('needs_practice', 50)] });

    expect(result.explanation.state).toBe('practising');
    expect(result.explanation.latestOutcome).toBe('needs_practice');
  });

  it('uses a passed assessment as a suggestion, not a permanent guarantee', () => {
    const result = build({ attempts: [attempt('passed', 50)] });

    expect(result.explanation.state).toBe('stable');
    expect(result.explanation.reason).toContain('suggestion');
  });

  it('prefers active-release assessments over a stale mastery snapshot', () => {
    const oldReleaseMastery: SkillMasteryRecord = {
      learnerId: '00000000-0000-4000-8000-000000000001',
      curriculumReleaseId: 'curriculum-v1.0.5',
      skillId: skill.id,
      state: 'stable',
      evidenceCount: 1,
      confidence: 90,
      lastAssessmentId: '00000000-0000-4000-8000-000000000002',
      lastAssessedAt: 40,
      nextReviewAt: null,
      decisionSource: 'evidence',
      correctionNote: null,
      updatedAt: 40
    };
    const result = build({
      mastery: [oldReleaseMastery],
      attempts: [attempt('needs_practice', 50)]
    });

    expect(result.mastery).toBeNull();
    expect(result.explanation.state).toBe('practising');
    expect(result.explanation.evidenceCount).toBe(1);
  });

  it('does not mix assessment evidence across curriculum releases', () => {
    const oldReleaseAttempt = {
      ...attempt('passed', 40),
      curriculumReleaseId: 'curriculum-v1.0.5'
    };
    const activeReleaseAttempt = attempt('needs_practice', 50);
    const result = build({
      attempts: [oldReleaseAttempt, activeReleaseAttempt]
    });

    expect(result.explanation.state).toBe('practising');
    expect(result.explanation.evidenceCount).toBe(1);
    expect(result.explanation.latestOutcome).toBe('needs_practice');
  });
});
