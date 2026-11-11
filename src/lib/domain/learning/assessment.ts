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

const evidenceScalarSchema = z.union([
  z.string().max(160),
  z.number().finite(),
  z.boolean(),
  z.null()
]);

/** Small, shallow evidence metadata only; never store media or arbitrary payloads. */
export const assessmentEvidenceSchema = z
  .record(
    z.string().min(1).max(60),
    z.union([evidenceScalarSchema, z.array(evidenceScalarSchema).max(40)])
  )
  .superRefine((value, context) => {
    if (Object.keys(value).length > 30) {
      context.addIssue({
        code: 'custom',
        message: 'Evidence may contain at most 30 fields.'
      });
    }
  });

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
    evidence: assessmentEvidenceSchema.default({}),
    assessedAt: z.number().int().nonnegative()
  })
  .strict();

export type AssessmentAttemptInput = z.infer<
  typeof assessmentAttemptInputSchema
>;
