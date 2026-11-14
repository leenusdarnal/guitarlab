import { z } from 'zod';

export const adaptiveRecommendationFeedbackActionSchema = z.enum([
  'dismiss',
  'correct'
]);

export const adaptiveRecommendationCorrectionSchema = z.enum([
  'already_confident',
  'too_difficult',
  'not_relevant'
]);

export const adaptiveRecommendationFeedbackSchema = z
  .object({
    id: z.string().uuid(),
    learnerId: z.string().uuid(),
    curriculumReleaseId: z.string().min(1).max(100),
    recommendationId: z.string().min(1).max(240),
    targetType: z.enum(['skill', 'exercise']),
    targetId: z.string().min(1).max(160),
    reasonCodes: z
      .array(
        z.enum([
          'assessment_needs_practice',
          'assessment_inconclusive',
          'review_overdue',
          'not_yet_assessed',
          'repeated_self_reported_difficulty'
        ])
      )
      .min(1)
      .max(5),
    action: adaptiveRecommendationFeedbackActionSchema,
    correction: adaptiveRecommendationCorrectionSchema.nullable(),
    createdAt: z.number().int().nonnegative()
  })
  .strict()
  .superRefine((record, context) => {
    if (record.action === 'dismiss' && record.correction !== null) {
      context.addIssue({
        code: 'custom',
        path: ['correction'],
        message: 'Dismissal feedback cannot include a correction reason.'
      });
    }
    if (record.action === 'correct' && record.correction === null) {
      context.addIssue({
        code: 'custom',
        path: ['correction'],
        message: 'Correction feedback requires a reason.'
      });
    }
  });

export type AdaptiveRecommendationFeedbackRecord = z.infer<
  typeof adaptiveRecommendationFeedbackSchema
>;
