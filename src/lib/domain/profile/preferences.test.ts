import { describe, expect, it } from 'vitest';
import {
  createEmptyProfilePreferences,
  profilePreferencesSchema
} from './preferences';

describe('learner profile preferences', () => {
  it('starts with no assumed instrument, handedness, goal or practice duration', () => {
    const profile = createEmptyProfilePreferences();

    expect(profilePreferencesSchema.parse(profile)).toEqual(profile);
    expect(profile.instrument).toBeNull();
    expect(profile.handedness).toBeNull();
    expect(profile.goals).toEqual([]);
    expect(profile.practiceMinutes).toBeNull();
  });

  it('accepts a learner-selected preference set', () => {
    const result = profilePreferencesSchema.safeParse({
      ...createEmptyProfilePreferences(),
      instrument: 'acoustic',
      handedness: 'right',
      tuning: 'E-A-D-G-B-E',
      startingPoint: 'fresh-beginner',
      goals: ['all-round-musician'],
      practiceMinutes: 20,
      lessonPresentation: 'balanced'
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid practice durations', () => {
    const result = profilePreferencesSchema.safeParse({
      ...createEmptyProfilePreferences(),
      practiceMinutes: 0
    });

    expect(result.success).toBe(false);
  });
});
