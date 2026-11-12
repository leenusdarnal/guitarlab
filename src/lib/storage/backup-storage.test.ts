import { describe, expect, it } from 'vitest';
import { createEmptyProfilePreferences } from '../domain/profile/preferences';
import { buildLearnerBackup, type LearnerBackupSource } from './backup-storage';

const learnerId = '8b34e7a9-9e4e-4ba6-8e16-1b497c7d4c01';
const anotherLearnerId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function makeSource(): LearnerBackupSource {
  return {
    profiles: [
      {
        id: learnerId,
        preferencesSchemaVersion: 1,
        preferences: {
          ...createEmptyProfilePreferences(),
          instrument: 'acoustic',
          practiceMinutes: 20
        },
        createdAt: 100,
        updatedAt: 100,
        lastActiveAt: null
      },
      {
        id: anotherLearnerId,
        preferencesSchemaVersion: 1,
        preferences: createEmptyProfilePreferences(),
        createdAt: 100,
        updatedAt: 100,
        lastActiveAt: null
      }
    ],
    lessonProgress: [
      {
        id: '5c1e2b4f-2a62-4fd5-9eb7-1dc79f86f1a7',
        learnerId,
        curriculumReleaseId: 'curriculum-v1',
        lessonId: 'year-1-week-1',
        status: 'in_progress',
        lastBlockId: null,
        startedAt: 100,
        completedAt: null,
        updatedAt: 100
      },
      {
        id: 'b5bfa60c-a276-4c3f-9279-1fb15731b67c',
        learnerId: anotherLearnerId,
        curriculumReleaseId: 'curriculum-v1',
        lessonId: 'year-1-week-1',
        status: 'in_progress',
        lastBlockId: null,
        startedAt: 100,
        completedAt: null,
        updatedAt: 100
      }
    ],
    completionEvents: [],
    assessmentAttempts: [],
    skillMastery: [],
    practiceSessions: [
      {
        id: 'b1b1b1b1-1111-4111-8111-111111111111',
        learnerId,
        primaryCurriculumReleaseId: null,
        primaryLessonId: null,
        status: 'completed',
        activeStartedAt: null,
        plannedMinutes: 20,
        actualDurationSeconds: 300,
        focus: 'Alternate picking',
        difficulty: null,
        reflection: null,
        startedAt: 100,
        endedAt: 400,
        createdAt: 100,
        updatedAt: 400
      }
    ],
    practiceEvidence: [
      {
        id: 'c1c1c1c1-1111-4111-8111-111111111111',
        learnerId,
        sessionId: 'b1b1b1b1-1111-4111-8111-111111111111',
        exerciseId: 'alternate-picking-eighth-notes',
        repetitions: 20,
        cleanRepetitions: 15,
        tempoBpm: 80,
        difficulty: 3,
        recordedAt: 200
      },
      {
        id: 'd1d1d1d1-1111-4111-8111-111111111111',
        learnerId: anotherLearnerId,
        sessionId: 'b1b1b1b1-1111-4111-8111-111111111111',
        exerciseId: 'outside-profile',
        repetitions: 1,
        cleanRepetitions: 1,
        tempoBpm: null,
        difficulty: null,
        recordedAt: 200
      }
    ]
  };
}

describe('local learner backup export builder', () => {
  it('includes the active profile and only records owned by that learner', () => {
    const backup = buildLearnerBackup(learnerId, 200, makeSource());

    expect(backup.learnerId).toBe(learnerId);
    expect(backup.exportedAt).toBe(200);
    expect(backup.records.profile.id).toBe(learnerId);
    expect(backup.records.profile.preferences.instrument).toBe('acoustic');
    expect(backup.records.lessonProgress).toHaveLength(1);
    expect(backup.records.lessonProgress[0].learnerId).toBe(learnerId);
    expect(backup.records.practiceEvidence).toHaveLength(1);
    expect(backup.records.practiceEvidence?.[0].learnerId).toBe(learnerId);
  });

  it('refuses to export when the active profile is missing', () => {
    expect(() =>
      buildLearnerBackup('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 200, makeSource())
    ).toThrow('active learner profile could not be found');
  });
});
