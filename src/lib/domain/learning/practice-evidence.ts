import { z } from 'zod';

/**
 * A learner-entered observation about one exercise in a practice session.
 * This is practice evidence, not an assessment or a skill-mastery decision.
 */
export const practiceEvidenceInputSchema = z
  .object({
    id: z.string().uuid(),
    learnerId: z.string().uuid(),
    sessionId: z.string().uuid(),
    exerciseId: z.string().min(1).max(160),
    repetitions: z.number().int().min(0).max(100_000),
    cleanRepetitions: z.number().int().min(0).max(100_000),
    tempoBpm: z.number().int().min(20).max(300).nullable(),
    difficulty: z.number().int().min(1).max(5).nullable(),
    recordedAt: z.number().int().nonnegative()
  })
  .strict()
  .superRefine((value, context) => {
    if (value.cleanRepetitions > value.repetitions) {
      context.addIssue({
        code: 'custom',
        path: ['cleanRepetitions'],
        message: 'Clean repetitions cannot exceed total repetitions.'
      });
    }
  });

export type PracticeEvidenceInput = z.infer<typeof practiceEvidenceInputSchema>;
