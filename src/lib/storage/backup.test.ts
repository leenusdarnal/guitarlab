import { describe, expect, it } from 'vitest';
import {
  createRestorePreview,
  LEARNER_BACKUP_FORMAT,
  LEARNER_BACKUP_VERSION,
  parseLearnerBackup,
  parseLearnerBackupJson,
  type LearnerBackup
} from './backup';

const learnerId = '8b34e7a9-9e4e-4ba6-8e16-1b497c7d4c01';
const progressId = '5c1e2b4f-2a62-4fd5-9eb7-1dc79f86f1a7';

function makeBackup(): LearnerBackup {
  return {
    format: LEARNER_BACKUP_FORMAT,
    version: LEARNER_BACKUP_VERSION,
    exportedAt: 1_800_000_000_000,
    learnerId,
    records: {
      profile: {
        id: learnerId,
        preferencesSchemaVersion: 1,
        preferences: {
          schemaVersion: 1,
          instrument: 'acoustic',
          handedness: null,
          tuning: null,
          startingPoint: 'fresh-beginner',
          goals: ['all-round-musician'],
          practiceMinutes: 20,
          availableDays: [],
          lessonPresentation: null
        },
        createdAt: 1_800_000_000_000,
        updatedAt: 1_800_000_000_000,
        lastActiveAt: null
      },
      lessonProgress: [
        {
          id: progressId,
          learnerId,
          curriculumReleaseId: 'curriculum-v1',
          lessonId: 'year-1-week-1',
          status: 'in_progress',
          lastBlockId: null,
          startedAt: 1_800_000_000_000,
          completedAt: null,
          updatedAt: 1_800_000_000_000
        }
      ],
      completionEvents: [],
      assessmentAttempts: [],
      skillMastery: [],
      practiceSessions: []
    }
  };
}

describe('learner backup contract', () => {
  it('accepts a valid versioned backup and parses JSON text', () => {
    const backup = makeBackup();
    expect(parseLearnerBackup(backup)).toEqual({ success: true, data: backup });
    expect(parseLearnerBackupJson(JSON.stringify(backup))).toEqual({
      success: true,
      data: backup
    });
  });

  it('round-trips M4.2 checkpoint state while accepting older version-1 backups', () => {
    const older = makeBackup();
    expect(parseLearnerBackup(older)).toMatchObject({ success: true });
    const newer = makeBackup();
    newer.records.lessonProgress[0] = {
      ...newer.records.lessonProgress[0],
      lastBlockId: 'guided-demo', completedBlockIds: ['guided-demo'],
      checkpointOutcome: 'needs_practice', checkpointNote: 'Keep the pulse relaxed.', revision: 1
    };
    expect(parseLearnerBackup(newer)).toMatchObject({
      success: true,
      data: { records: { lessonProgress: [{
        completedBlockIds: ['guided-demo'], checkpointOutcome: 'needs_practice',
        checkpointNote: 'Keep the pulse relaxed.', revision: 1
      }] } }
    });
  });

  it('rejects malformed JSON, unsupported versions and oversized files', () => {
    expect(parseLearnerBackupJson('{')).toMatchObject({
      success: false,
      message: 'The selected file is not valid JSON.'
    });
    expect(parseLearnerBackup({ ...makeBackup(), version: 99 })).toMatchObject({
      success: false
    });
    expect(parseLearnerBackupJson('x'.repeat(10_000_001))).toMatchObject({
      success: false,
      message: expect.stringContaining('too large')
    });
  });

  it('rejects mismatched learner ownership and duplicate record IDs', () => {
    const backup = makeBackup();
    const mismatched = {
      ...backup,
      records: {
        ...backup.records,
        lessonProgress: backup.records.lessonProgress.map((record) => ({
          ...record,
          learnerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        }))
      }
    };
    expect(parseLearnerBackup(mismatched)).toMatchObject({ success: false });

    const duplicate = makeBackup();
    duplicate.records.lessonProgress.push({
      ...duplicate.records.lessonProgress[0]
    });
    expect(parseLearnerBackup(duplicate)).toMatchObject({
      success: false,
      message: expect.stringContaining('duplicate')
    });
  });

  it('rejects relational orphans before restore can write anything', () => {
    const backup = makeBackup();
    backup.records.completionEvents.push({
      id: '799e5d99-6526-4c04-a9d8-01ac26032c0e',
      progressId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      learnerId,
      curriculumReleaseId: 'curriculum-v1',
      lessonId: 'year-1-week-1',
      completionSource: 'learner_confirmed',
      completedAt: 1_800_000_000_000
    });
    expect(parseLearnerBackup(backup)).toMatchObject({
      success: false,
      message: expect.stringContaining('completionEvents')
    });
  });

  it('previews additions, replacements and removals without mutating datasets', () => {
    const incoming = makeBackup();
    const existing = structuredClone(incoming.records);
    existing.lessonProgress.push({
      id: '0b0be34d-9a98-4b49-86f7-6f2974cde590',
      learnerId,
      curriculumReleaseId: 'curriculum-v1',
      lessonId: 'year-1-week-2',
      status: 'in_progress',
      lastBlockId: null,
      startedAt: 1_800_000_000_000,
      completedAt: null,
      updatedAt: 1_800_000_000_000
    });
    const originalExistingCount = existing.lessonProgress.length;
    const preview = createRestorePreview(incoming, existing);

    expect(preview.records.profile).toEqual({ add: 0, replace: 1, remove: 0 });
    expect(preview.records.lessonProgress).toEqual({
      add: 0,
      replace: 1,
      remove: 1
    });
    expect(preview.totals).toEqual({
      add: 0,
      replace: 2,
      remove: 1
    });
    expect(existing.lessonProgress).toHaveLength(originalExistingCount);
    expect(incoming.records.lessonProgress).toHaveLength(1);
  });

  it('marks a restore that replaces a different active learner profile', () => {
    const incoming = makeBackup();
    const existing = structuredClone(incoming.records);
    existing.profile.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    expect(createRestorePreview(incoming, existing).replacesActiveProfile).toBe(true);
    expect(createRestorePreview(incoming, null).replacesActiveProfile).toBe(false);
  });
});
