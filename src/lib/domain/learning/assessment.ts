import { z } from 'zod';

export const assessmentKindSchema = z.enum([
  'checkpoint',
  'guided_self_check',
  'recording_review',
  'measured'
]);

export const evidenceTypeSchema = z.enum([
  'measured',
  'observed_or_self_checked',
  'self_reported',
  'recording_reviewed'
]);

export const assessmentOutcomeSchema = z.enum([
  'passed',
  'needs_practice',
  'inconclusive'
]);

/**
 * Structured assessment evidence. Audio and recording blobs are deliberately
 * excluded: this contract stores a summary and small metadata only.
 */
export const assessmentAttemptInputSchema = z
  .object({
    id: z.string().uuid(),
    learnerId: z.string().uuid(),
    curriculumReleaseId: z.string().min(1).max(100),
    skillId: z.string().min(1).max(120),
    lessonId: z.string().min(1).max(160).nullable(),
    assessmentKind: assessmentKindSchema,
    evidenceType: evidenceTypeSchema,
    outcome: assessmentOutcomeSchema,
    score: z.number().int().min(0).max(100).nullable(),
    evidenceSummary: z.string().max(1000).nullable(),
    evidence: z.record(z.string(), z.unknown()).default({}),
    assessedAt: z.number().int().nonnegative()
  })
  .strict();

export type AssessmentAttemptInput = z.infer<
  typeof assessmentAttemptInputSchema
>;
