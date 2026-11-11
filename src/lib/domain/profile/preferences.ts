import { z } from 'zod';

export const profilePreferencesSchema = z.object({
  schemaVersion: z.literal(1),
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
  availableDays: z.array(z.number().int().min(0).max(6)).max(7),
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
    lessonPresentation: null
  };
}
