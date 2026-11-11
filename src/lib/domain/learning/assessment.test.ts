import { describe, expect, it } from 'vitest';
import { assessmentAttemptInputSchema } from './assessment';

const valid = {
  id: '8e35fc81-dc90-4fe7-9c5e-93a84170f0e1',
  learnerId: '6d1a32df-2cbd-4930-b594-32ed2f8a44e2',
  curriculumReleaseId: 'curriculum-v1',
  skillId: 'instrument.tuning',
  lessonId: 'y1-w01-lesson',
  assessmentKind: 'checkpoint',
  evidenceType: 'observed_or_self_checked',
  outcome: 'needs_practice',
  score: null,
  evidenceSummary: 'The learner identified five of six strings correctly.',
  evidence: { correctItems: 5, totalItems: 6 },
  assessedAt: 1794355200000
} as const;

describe('assessment attempt validation', () => {
  it('accepts bounded structured evidence', () => {
    expect(assessmentAttemptInputSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects out-of-range scores', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({ ...valid, score: 101 }).success
    ).toBe(false);
  });

  it('rejects evidence values that could contain private media or oversized payloads', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        evidence: { recording: 'x'.repeat(161) }
      }).success
    ).toBe(false);
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        evidence: Object.fromEntries(
          Array.from({ length: 31 }, (_, index) => [`field${index}`, index])
        )
      }).success
    ).toBe(false);
  });

  it('rejects unbounded private media fields', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        recordingBlob: 'base64-audio-data'
      }).success
    ).toBe(false);
  });
});
