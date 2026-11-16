import { describe, expect, it } from 'vitest';
import {
  createEmptyProfilePreferences,
  profilePreferencesSchema
} from './preferences';

describe('learner profile preferences', () => {
  it('starts with no assumed goal or practice duration', () => {
    const profile = createEmptyProfilePreferences();

    expect(profilePreferencesSchema.parse(profile)).toEqual(profile);
    expect(profile.instrument).toBeNull();
    expect(profile.handedness).toBeNull();
    expect(profile.goals).toEqual([]);
    expect(profile.practiceMinutes).toBeNull();
  });

  it('accepts a learner-selected preference set', () => {
    const storedPreferences = {
      ...createEmptyProfilePreferences(),
      instrument: 'acoustic' as const,
      handedness: 'right' as const,
      tuning: 'E-A-D-G-B-E',
      startingPoint: 'fresh-beginner' as const,
      goals: ['all-round-musician' as const],
      practiceMinutes: 20,
      availableDays: [1, 3, 5],
      lessonPresentation: 'visual-first' as const
    };

    expect(profilePreferencesSchema.parse(storedPreferences)).toEqual(
      storedPreferences
    );
  });

  it('rejects invalid practice durations', () => {
    const result = profilePreferencesSchema.safeParse({
      ...createEmptyProfilePreferences(),
      practiceMinutes: 0
    });

    expect(result.success).toBe(false);
  });
});
