import { z } from 'zod';

export const skillMasteryStateSchema = z.enum([
  'not_started',
  'learning',
  'practising',
  'stable',
  'review_due'
]);

/**
 * Stable mastery cannot be inferred from elapsed time or lesson completion.
 * A passed assessment attempt is required before writing this state.
 */
export const skillMasteryUpdateSchema = z
  .object({
    learnerId: z.string().uuid(),
    curriculumReleaseId: z.string().min(1).max(100),
    skillId: z.string().min(1).max(120),
    state: skillMasteryStateSchema,
    evidenceCount: z.number().int().nonnegative(),
    confidence: z.number().int().min(0).max(100).nullable(),
    lastAssessmentId: z.string().uuid().nullable(),
    lastAssessedAt: z.number().int().nonnegative().nullable(),
    nextReviewAt: z.number().int().nonnegative().nullable(),
    decisionSource: z.enum(['evidence', 'learner']).optional(),
    correctionNote: z.string().trim().min(1).max(500).nullable().optional()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.decisionSource === 'learner' && !value.correctionNote) {
      context.addIssue({
        code: 'custom',
        path: ['correctionNote'],
        message: 'A learner correction needs a short explanation.'
      });
    }
    if (value.decisionSource !== 'learner' && value.correctionNote) {
      context.addIssue({
        code: 'custom',
        path: ['correctionNote'],
        message: 'A correction note is only valid for a learner correction.'
      });
    }
    if (
      value.state === 'stable' &&
      (value.evidenceCount < 1 || !value.lastAssessmentId)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['lastAssessmentId'],
        message:
          'Stable mastery requires at least one linked assessment attempt.'
      });
    }
  });

export type SkillMasteryUpdate = z.infer<typeof skillMasteryUpdateSchema>;
