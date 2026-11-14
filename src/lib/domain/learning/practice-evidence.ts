import { z } from 'zod';

const uuid = z.string().uuid();

const observationFields = {
  exerciseId: z.string().min(1).max(160),
  repetitions: z.number().int().min(0).max(100_000),
  cleanRepetitions: z.number().int().min(0).max(100_000),
  tempoBpm: z.number().int().min(20).max(300).nullable(),
  difficulty: z.number().int().min(1).max(5).nullable()
};

/** Fields supplied by a learner when recording one exercise observation. */
export const practiceEvidenceSubmissionSchema = z
  .object({
    sessionId: uuid,
    ...observationFields
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

/**
 * An append-only learner-entered observation about one exercise in a session.
 * This is activity evidence, not an assessment or a skill-mastery decision.
 */
export const practiceEvidenceInputSchema = z
  .object({
    id: uuid,
    learnerId: uuid,
    sessionId: uuid,
    ...observationFields,
    recordedAt: z.number().int().nonnegative(),
    curriculumReleaseId: z.string().min(1).max(100).nullable().optional(),
    lessonId: z.string().min(1).max(160).nullable().optional(),
    authoredExerciseId: z.string().min(1).max(160).nullable().optional(),
    practiceTaxonomyVersion: z.string().min(1).max(40).nullable().optional()
  })
  .strict()
  .superRefine((value, context) => {
    const identity = [value.curriculumReleaseId, value.lessonId, value.authoredExerciseId, value.practiceTaxonomyVersion];
    const hasAnyIdentity = identity.some((part) => part !== undefined && part !== null);
    const hasCompleteIdentity = identity.every((part) => typeof part === 'string' && part.length > 0);
    if (hasAnyIdentity && !hasCompleteIdentity) {
      context.addIssue({
        code: 'custom',
        path: ['authoredExerciseId'],
        message: 'Authored practice identity must include release, lesson, exercise and taxonomy version.'
      });
    }
    if (value.cleanRepetitions > value.repetitions) {
      context.addIssue({
        code: 'custom',
        path: ['cleanRepetitions'],
        message: 'Clean repetitions cannot exceed total repetitions.'
      });
    }
  });

export type PracticeEvidenceInput = z.infer<typeof practiceEvidenceInputSchema>;
export type PracticeEvidenceSubmission = z.infer<
  typeof practiceEvidenceSubmissionSchema
>;
