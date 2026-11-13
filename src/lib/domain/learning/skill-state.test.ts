import { describe, expect, it } from 'vitest';
import type { AssessmentAttemptRecord, SkillMasteryRecord } from '../../repositories/contracts';
import { explainSkillState } from './skill-state';

const learnerId = '6d1a32df-2cbd-4930-b594-32ed2f8a44e2';
const baseAttempt: AssessmentAttemptRecord = {
  id: '8e35fc81-dc90-4fe7-9c5e-93a84170f0e1',
  learnerId,
  curriculumReleaseId: 'curriculum-v1',
  skillId: 'instrument.tuning',
  lessonId: null,
  assessmentKind: 'checkpoint',
  evidenceType: 'observed_or_self_checked',
  outcome: 'passed',
  score: null,
  evidenceSummary: null,
  evidence: {},
  assessedAt: 100,
  recordedAt: 100
};

const stable: SkillMasteryRecord = {
  learnerId,
  curriculumReleaseId: 'curriculum-v1',
  skillId: 'instrument.tuning',
  state: 'stable',
  evidenceCount: 1,
  confidence: null,
  lastAssessmentId: baseAttempt.id,
  lastAssessedAt: baseAttempt.assessedAt,
  nextReviewAt: 200,
  updatedAt: 100
};

describe('explainSkillState', () => {
  it('does not infer progress from practice when there are no assessments', () => {
    expect(explainSkillState({ attempts: [], current: null, now: 100 })).toMatchObject({
      state: 'not_started',
      evidenceCount: 0,
      rule: 'no-assessments'
    });
  });

  it('explains a passed latest assessment as a stable suggestion', () => {
    expect(explainSkillState({ attempts: [baseAttempt], current: null, now: 100 })).toMatchObject({
      state: 'stable',
      latestOutcome: 'passed',
      rule: 'latest-passed'
    });
  });

  it('uses the latest assessment rather than array order', () => {
    const later = { ...baseAttempt, id: '9e35fc81-dc90-4fe7-9c5e-93a84170f0e2', outcome: 'needs_practice' as const, assessedAt: 300, recordedAt: 300 };
    expect(explainSkillState({ attempts: [later, baseAttempt], current: null, now: 400 })).toMatchObject({
      state: 'practising',
      latestOutcome: 'needs_practice',
      rule: 'latest-needs-practice'
    });
  });

  it('keeps inconclusive evidence in learning rather than stable', () => {
    const attempt = { ...baseAttempt, outcome: 'inconclusive' as const };
    expect(explainSkillState({ attempts: [attempt], current: null, now: 100 })).toMatchObject({
      state: 'learning',
      rule: 'latest-inconclusive'
    });
  });

  it('marks an existing stable state review due when its date arrives', () => {
    expect(explainSkillState({ attempts: [baseAttempt], current: stable, now: 200 })).toMatchObject({
      state: 'review_due',
      nextReviewAt: 200,
      rule: 'review-date-reached'
    });
  });

  it('does not mark a stable skill review due before its review date', () => {
    expect(explainSkillState({ attempts: [baseAttempt], current: stable, now: 199 })).toMatchObject({
      state: 'stable',
      rule: 'latest-passed'
    });
  });
});
