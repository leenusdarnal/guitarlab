import { z } from 'zod';

const uuid = z.string().uuid();
const timestamp = z.number().int().nonnegative();

export const practiceRoutineExerciseSchema = z
  .object({
    id: uuid,
    name: z.string().trim().min(1).max(160),
    minutes: z.number().int().min(1).max(180)
  })
  .strict();

const exerciseSequenceSchema = z
  .array(practiceRoutineExerciseSchema)
  .min(1)
  .max(12)
  .superRefine((exercises, context) => {
    if (new Set(exercises.map((exercise) => exercise.id)).size !== exercises.length) {
      context.addIssue({
        code: 'custom',
        message: 'Each exercise in a routine must have a unique identifier.'
      });
    }
    const total = exercises.reduce((minutes, exercise) => minutes + exercise.minutes, 0);
    if (total < 5 || total > 180) {
      context.addIssue({
        code: 'custom',
        message: 'A routine must total between 5 and 180 minutes.'
      });
    }
  });

const routineName = z.string().trim().min(1).max(80);

export const practiceRoutineSchema = z
  .object({
    id: uuid,
    name: routineName,
    focus: z.string().trim().max(180).nullable(),
    exercises: exerciseSequenceSchema,
    createdAt: timestamp,
    updatedAt: timestamp
  })
  .strict();

export const practiceRoutineSnapshotSchema = z
  .object({
    id: uuid,
    name: routineName,
    exercises: exerciseSequenceSchema
  })
  .strict();

export type PracticeRoutineExercise = z.infer<
  typeof practiceRoutineExerciseSchema
>;
export type PracticeRoutine = z.infer<typeof practiceRoutineSchema>;
export type PracticeRoutineSnapshot = z.infer<
  typeof practiceRoutineSnapshotSchema
>;

/** Freeze a routine's order and time allocations into the started session. */
export function createPracticeRoutineSnapshot(
  routine: PracticeRoutine
): PracticeRoutineSnapshot {
  return practiceRoutineSnapshotSchema.parse({
    id: routine.id,
    name: routine.name,
    exercises: routine.exercises.map((exercise) => ({ ...exercise }))
  });
}
