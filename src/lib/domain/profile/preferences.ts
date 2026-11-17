import { z } from 'zod';
import { practiceRoutineSchema } from '../learning/practice-routine';

export const profilePreferencesSchema = z.object({
  schemaVersion: z.literal(1),
  // Compatibility-only values: preserve these fields when older local profiles or backups
  // are re-saved. They are not offered in setup until an active feature consumes them.
  instrument: z.enum(['acoustic', 'electric', 'classical', 'other']).nullable(),
  handedness: z.enum(['right', 'left']).nullable(),
  tuning: z.string().trim().min(1).max(80).nullable(),
  startingPoint: z
    .enum(['fresh-beginner', 'some-experience', 'placement-needed'])
    .nullable(),
  goals: z
    .array(
      z.enum([
        'all-round-musician',
        'acoustic-fingerstyle',
        'rock-blues',
        'jazz-harmony',
        'singer-songwriter',
        'custom'
      ])
    )
    .max(6),
  practiceMinutes: z.number().int().min(5).max(180).nullable(),
  // Retained for profile compatibility until schedule-aware planning is implemented.
  availableDays: z.array(z.number().int().min(0).max(6)).max(7),
  // Controls the teaching-section order in the authored lesson reader.
  practiceRoutines: z.array(practiceRoutineSchema).max(12).default([]),
  lessonPresentation: z
    .enum([
      'balanced',
      'visual-first',
      'demonstration-first',
      'text-first',
      'interactive-first',
      'song-first'
    ])
    .nullable()
}).superRefine((preferences, context) => {
  const routineIds = preferences.practiceRoutines.map((routine) => routine.id);
  if (new Set(routineIds).size !== routineIds.length) {
    context.addIssue({
      code: 'custom',
      path: ['practiceRoutines'],
      message: 'Saved practice routine identifiers must be unique.'
    });
  }
});

export type ProfilePreferences = z.infer<typeof profilePreferencesSchema>;

/** A new profile deliberately contains no assumed learner preferences or progress. */
export function createEmptyProfilePreferences(): ProfilePreferences {
  return {
    schemaVersion: 1,
    instrument: null,
    handedness: null,
    tuning: null,
    startingPoint: null,
    goals: [],
    practiceMinutes: null,
    availableDays: [],
    practiceRoutines: [],
    lessonPresentation: null
  };
}
