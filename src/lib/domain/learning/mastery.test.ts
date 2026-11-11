import { describe, expect, it } from 'vitest';
import { skillMasteryUpdateSchema } from './mastery';

const base = {
  learnerId: '6d1a32df-2cbd-4930-b594-32ed2f8a44e2',
  curriculumReleaseId: 'curriculum-v1',
  skillId: 'instrument.tuning',
  evidenceCount: 0,
  confidence: null,
  lastAssessmentId: null,
  lastAssessedAt: null,
  nextReviewAt: null
};

describe('skill mastery state validation', () => {
  it('does not allow stable mastery without evidence', () => {
    expect(
      skillMasteryUpdateSchema.safeParse({ ...base, state: 'stable' }).success
    ).toBe(false);
  });

  it('allows a learner to be practising without implying mastery', () => {
    expect(
      skillMasteryUpdateSchema.safeParse({ ...base, state: 'practising' }).success
    ).toBe(true);
  });

  it('requires a linked attempt when stable mastery is claimed', () => {
    expect(
      skillMasteryUpdateSchema.safeParse({
        ...base,
        state: 'stable',
        evidenceCount: 2,
        lastAssessmentId: '8e35fc81-dc90-4fe7-9c5e-93a84170f0e1'
      }).success
    ).toBe(true);
  });
});
