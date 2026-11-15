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

export const assessmentItemOutcomeSchema = z.enum([
  'correct',
  'incorrect',
  'inconclusive'
]);

export const assessmentInstrumentSchema = z
  .object({
    definitionId: z.string().min(1).max(120),
    definitionVersion: z.number().int().positive(),
    scoringRuleVersion: z.string().min(1).max(80),
    itemCount: z.number().int().min(1).max(100),
    passThreshold: z.number().int().min(0).max(100),
    decisionScope: z.enum(['skill_level', 'supporting_probe'])
  })
  .strict();

export const assessmentItemEvidenceSchema = z
  .object({
    itemId: z.string().min(1).max(160),
    response: z.string().min(1).max(120).nullable(),
    outcome: assessmentItemOutcomeSchema,
    responseSource: z.enum(['learner_selected_option', 'no_response'])
  })
  .strict()
  .superRefine((item, context) => {
    if (item.response === null && item.responseSource !== 'no_response') {
      context.addIssue({
        code: 'custom',
        path: ['responseSource'],
        message: 'A missing response must be marked as no_response.'
      });
    }
    if (
      item.response !== null &&
      item.responseSource !== 'learner_selected_option'
    ) {
      context.addIssue({
        code: 'custom',
        path: ['responseSource'],
        message: 'A captured response must identify its learner input source.'
      });
    }
    if (item.response === null && item.outcome !== 'inconclusive') {
      context.addIssue({
        code: 'custom',
        path: ['outcome'],
        message: 'An item without a response must be inconclusive.'
      });
    }
  });

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
const assessmentAttemptObjectSchema = z
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
    assessmentInstrument: assessmentInstrumentSchema.optional(),
    itemEvidence: z
      .array(assessmentItemEvidenceSchema)
      .min(1)
      .max(100)
      .optional(),
    assessedAt: z.number().int().nonnegative()
  })
  .strict();

type AssessmentAttemptValidationFields = Pick<
  z.output<typeof assessmentAttemptObjectSchema>,
  'outcome' | 'score' | 'assessmentInstrument' | 'itemEvidence'
>;

function validateAssessmentAttemptEvidence(
  attempt: AssessmentAttemptValidationFields,
  context: z.RefinementCtx
): void {
  if (Boolean(attempt.assessmentInstrument) !== Boolean(attempt.itemEvidence)) {
    context.addIssue({
      code: 'custom',
      path: ['itemEvidence'],
      message:
        'Instrument provenance and item evidence must be recorded together.'
    });
  }
  if (attempt.itemEvidence && attempt.assessmentInstrument) {
    const itemIds = attempt.itemEvidence.map((item) => item.itemId);
    if (new Set(itemIds).size !== itemIds.length) {
      context.addIssue({
        code: 'custom',
        path: ['itemEvidence'],
        message: 'An assessment attempt cannot contain duplicate item IDs.'
      });
    }

    if (
      attempt.itemEvidence.length !== attempt.assessmentInstrument.itemCount
    ) {
      context.addIssue({
        code: 'custom',
        path: ['itemEvidence'],
        message:
          'The item evidence count must match the authored assessment definition.'
      });
    }

    const hasInconclusiveItem = attempt.itemEvidence.some(
      (item) => item.outcome === 'inconclusive'
    );
    if (
      hasInconclusiveItem &&
      (attempt.outcome !== 'inconclusive' || attempt.score !== null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['outcome'],
        message:
          'Attempts with inconclusive item evidence must have an inconclusive outcome and no score.'
      });
    }
    if (!hasInconclusiveItem) {
      const correctCount = attempt.itemEvidence.filter(
        (item) => item.outcome === 'correct'
      ).length;
      const expectedScore = Math.round(
        (correctCount / attempt.assessmentInstrument.itemCount) * 100
      );
      const expectedOutcome =
        expectedScore >= attempt.assessmentInstrument.passThreshold
          ? 'passed'
          : 'needs_practice';
      if (
        attempt.score !== expectedScore ||
        attempt.outcome !== expectedOutcome
      ) {
        context.addIssue({
          code: 'custom',
          path: ['score'],
          message:
            'The score and attempt outcome must match the recorded item outcomes and versioned pass threshold.'
        });
      }
    }
  }
}

export const assessmentAttemptInputSchema =
  assessmentAttemptObjectSchema.superRefine(validateAssessmentAttemptEvidence);

export const assessmentAttemptSubmissionSchema = assessmentAttemptObjectSchema
  .omit({
    id: true,
    learnerId: true,
    assessedAt: true
  })
  .superRefine(validateAssessmentAttemptEvidence);

export const assessmentAttemptRecordSchema = assessmentAttemptObjectSchema
  .extend({ recordedAt: z.number().int().nonnegative() })
  .strict()
  .superRefine(validateAssessmentAttemptEvidence);

export type AssessmentAttemptInput = z.infer<
  typeof assessmentAttemptInputSchema
>;
