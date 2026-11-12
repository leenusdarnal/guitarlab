import { z } from 'zod';

const uuid = z.string().uuid();

const observationFields = {
  exerciseId: z.string().min(1).max(160),
  repetitions: z.number().int().min(0).max(100_000),
  cleanRepetitions: z.number().int().min(0).max(100_000),
  tempoBpm: z.number().int().min(20).max(300).nullable(),
  difficulty: z.number().int().min(1).max(5).nullable()
};

function enforceObservationInvariants<T extends z.ZodTypeAny>(schema: T) {
  return schema.superRefine((value: z.infer<T>, context) => {
    if (value.cleanRepetitions > value.repetitions) {
      context.addIssue({
        code: 'custom',
        path: ['cleanRepetitions'],
        message: 'Clean repetitions cannot exceed total repetitions.'
      });
    }
  });
}

/** Fields supplied by a learner when recording one exercise observation. */
export const practiceEvidenceSubmissionSchema = enforceObservationInvariants(
  z.object({
    sessionId: uuid,
    ...observationFields
  }).strict()
);

/**
 * An append-only learner-entered observation about one exercise in a session.
 * This is activity evidence, not an assessment or a skill-mastery decision.
 */
export const practiceEvidenceInputSchema = enforceObservationInvariants(
  z.object({
    id: uuid,
    learnerId: uuid,
    sessionId: uuid,
    ...observationFields,
    recordedAt: z.number().int().nonnegative()
  }).strict()
);

export type PracticeEvidenceInput = z.infer<typeof practiceEvidenceInputSchema>;
export type PracticeEvidenceSubmission = z.infer<typeof practiceEvidenceSubmissionSchema>;
