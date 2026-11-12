import {
  createEmptyLocalLearnerProfile,
  openLocalDatabase
} from './indexeddb';
import {
  createRestorePreview,
  learnerBackupSchema,
  parseLearnerBackupJson,
  type LearnerBackup,
  type LearnerBackupRecords,
  type RestorePreview
} from './backup';
import type {
  AssessmentAttemptRecord,
  LearnerProfileRecord,
  LessonCompletionEventRecord,
  LessonProgressRecord,
  PracticeEvidenceRecord,
  PracticeSessionRecord,
  SkillMasteryRecord
} from '../repositories/contracts';

const storeNames = [
  'metadata',
  'learnerProfiles',
  'lessonProgress',
  'lessonCompletionEvents',
  'assessmentAttempts',
  'skillMastery',
  'practiceSessions',
  'practiceEvidence'
] as const;

type ActiveMetadata = { key: string; value: string };

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Local learner database request failed.'));
  });
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Local learner data transaction aborted.'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Local learner data transaction failed.'));
  });
}

async function readActiveRecords(database: IDBDatabase): Promise<LearnerBackupRecords | null> {
  const transaction = database.transaction([...storeNames], 'readonly');
  const completed = transactionResult(transaction);
  try {
    const metadata = await requestResult<ActiveMetadata | undefined>(
      transaction.objectStore('metadata').get('activeLearnerId')
    );
    if (!metadata) {
      await completed;
      return null;
    }

    const [profiles, progress, events, attempts, mastery, sessions, evidence] = await Promise.all([
      requestResult<LearnerProfileRecord[]>(
        transaction.objectStore('learnerProfiles').getAll()
      ),
      requestResult<LessonProgressRecord[]>(
        transaction.objectStore('lessonProgress').getAll()
      ),
      requestResult<LessonCompletionEventRecord[]>(
        transaction.objectStore('lessonCompletionEvents').getAll()
      ),
      requestResult<AssessmentAttemptRecord[]>(
        transaction.objectStore('assessmentAttempts').getAll()
      ),
      requestResult<SkillMasteryRecord[]>(
        transaction.objectStore('skillMastery').getAll()
      ),
      requestResult<PracticeSessionRecord[]>(
        transaction.objectStore('practiceSessions').getAll()
      ),
      requestResult<PracticeEvidenceRecord[]>(
        transaction.objectStore('practiceEvidence').getAll()
      )
    ]);
    await completed;

    const profile = profiles.find((record) => record.id === metadata.value);
    if (!profile) return null;
    if (profile.preferencesSchemaVersion !== 1) {
      throw new Error('The active learner profile uses an unsupported preferences version.');
    }
    const backupProfile = {
      ...profile,
      preferencesSchemaVersion: 1 as const
    };
    const owned = <T extends { learnerId: string }>(records: T[]) =>
      records.filter((record) => record.learnerId === metadata.value);

    return {
      profile: backupProfile,
      lessonProgress: owned(progress),
      completionEvents: owned(events),
      assessmentAttempts: owned(attempts),
      skillMastery: owned(mastery),
      practiceSessions: owned(sessions),
      practiceEvidence: owned(evidence)
    };
  } catch (error) {
    await completed.catch(() => undefined);
    throw error;
  }
}

export type RestoreReview =
  | { success: false; message: string }
  | { success: true; backup: LearnerBackup; preview: RestorePreview };

/** Read and validate a candidate file; this function never mutates IndexedDB. */
export async function reviewLearnerBackup(contents: string): Promise<RestoreReview> {
  const parsed = parseLearnerBackupJson(contents);
  if (!parsed.success) return parsed;

  const database = await openLocalDatabase();
  try {
    const existing = await readActiveRecords(database);
    return {
      success: true,
      backup: parsed.data,
      preview: createRestorePreview(parsed.data, existing)
    };
  } finally {
    database.close();
  }
}

/**
 * Replace the current active learner's complete dataset in one IDB transaction.
 * The transaction is all-or-nothing. The caller must have shown a preview and
 * obtained explicit confirmation before calling this function.
 */
export async function restoreLearnerBackup(
  untrustedBackup: unknown,
  confirmed: boolean
): Promise<void> {
  if (!confirmed) throw new Error('Confirm the restore before replacing local data.');
  const backup = learnerBackupSchema.parse(untrustedBackup);
  const database = await openLocalDatabase();

  try {
    const transaction = database.transaction([...storeNames], 'readwrite');
    const completed = transactionResult(transaction);
    const metadataStore = transaction.objectStore('metadata');
    const profileStore = transaction.objectStore('learnerProfiles');
    const progressStore = transaction.objectStore('lessonProgress');
    const eventStore = transaction.objectStore('lessonCompletionEvents');
    const assessmentStore = transaction.objectStore('assessmentAttempts');
    const masteryStore = transaction.objectStore('skillMastery');
    const practiceStore = transaction.objectStore('practiceSessions');
    const evidenceStore = transaction.objectStore('practiceEvidence');

    try {
      const active = await requestResult<ActiveMetadata | undefined>(
        metadataStore.get('activeLearnerId')
      );
      const [profiles, progress, events, assessments, mastery, sessions, evidence] = await Promise.all([
        requestResult<LearnerProfileRecord[]>(profileStore.getAll()),
        requestResult<LessonProgressRecord[]>(progressStore.getAll()),
        requestResult<LessonCompletionEventRecord[]>(eventStore.getAll()),
        requestResult<AssessmentAttemptRecord[]>(assessmentStore.getAll()),
        requestResult<SkillMasteryRecord[]>(masteryStore.getAll()),
        requestResult<PracticeSessionRecord[]>(practiceStore.getAll()),
        requestResult<PracticeEvidenceRecord[]>(evidenceStore.getAll())
      ]);

      const replacedLearnerIds = new Set([active?.value, backup.learnerId].filter(
        (value): value is string => Boolean(value)
      ));

      for (const profile of profiles) {
        if (replacedLearnerIds.has(profile.id)) {
          await requestResult(profileStore.delete(profile.id));
        }
      }
      for (const record of progress) {
        if (replacedLearnerIds.has(record.learnerId)) {
          await requestResult(progressStore.delete(record.id));
        }
      }
      for (const record of events) {
        if (replacedLearnerIds.has(record.learnerId)) {
          await requestResult(eventStore.delete(record.id));
        }
      }
      for (const record of assessments) {
        if (replacedLearnerIds.has(record.learnerId)) {
          await requestResult(assessmentStore.delete(record.id));
        }
      }
      for (const record of mastery) {
        if (replacedLearnerIds.has(record.learnerId)) {
          await requestResult(
            masteryStore.delete([
              record.learnerId,
              record.curriculumReleaseId,
              record.skillId
            ])
          );
        }
      }
      for (const record of sessions) {
        if (replacedLearnerIds.has(record.learnerId)) {
          await requestResult(practiceStore.delete(record.id));
        }
      }
      for (const record of evidence) {
        if (replacedLearnerIds.has(record.learnerId)) {
          await requestResult(evidenceStore.delete(record.id));
        }
      }

      await requestResult(profileStore.put(backup.records.profile));
      for (const record of backup.records.lessonProgress) {
        await requestResult(progressStore.put(record));
      }
      for (const record of backup.records.completionEvents) {
        await requestResult(eventStore.put(record));
      }
      for (const record of backup.records.assessmentAttempts) {
        await requestResult(assessmentStore.put(record));
      }
      for (const record of backup.records.skillMastery) {
        await requestResult(masteryStore.put(record));
      }
      for (const record of backup.records.practiceSessions) {
        await requestResult(practiceStore.put(record));
      }
      for (const record of backup.records.practiceEvidence ?? []) {
        await requestResult(evidenceStore.put(record));
      }
      await requestResult(
        metadataStore.put({ key: 'activeLearnerId', value: backup.learnerId })
      );

      await completed;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }
      await completed.catch(() => undefined);
      throw error;
    }
  } finally {
    database.close();
  }
}

/** Reset only the active learner and create a fresh empty profile atomically. */
export async function resetActiveLearnerData(confirmed: boolean): Promise<void> {
  if (!confirmed) throw new Error('Confirm the reset before deleting local learner data.');
  const database = await openLocalDatabase();

  try {
    const transaction = database.transaction([...storeNames], 'readwrite');
    const completed = transactionResult(transaction);
    const metadata = transaction.objectStore('metadata');
    const profiles = transaction.objectStore('learnerProfiles');
    const progress = transaction.objectStore('lessonProgress');
    const events = transaction.objectStore('lessonCompletionEvents');
    const assessments = transaction.objectStore('assessmentAttempts');
    const mastery = transaction.objectStore('skillMastery');
    const practice = transaction.objectStore('practiceSessions');
    const evidence = transaction.objectStore('practiceEvidence');

    try {
      const active = await requestResult<ActiveMetadata | undefined>(
        metadata.get('activeLearnerId')
      );

      if (active) {
        const [progressRows, eventRows, assessmentRows, masteryRows, practiceRows, evidenceRows] =
          await Promise.all([
            requestResult<LessonProgressRecord[]>(progress.getAll()),
            requestResult<LessonCompletionEventRecord[]>(events.getAll()),
            requestResult<AssessmentAttemptRecord[]>(assessments.getAll()),
            requestResult<SkillMasteryRecord[]>(mastery.getAll()),
            requestResult<PracticeSessionRecord[]>(practice.getAll()),
            requestResult<PracticeEvidenceRecord[]>(evidence.getAll())
          ]);

        for (const record of progressRows) {
          if (record.learnerId === active.value) await requestResult(progress.delete(record.id));
        }
        for (const record of eventRows) {
          if (record.learnerId === active.value) await requestResult(events.delete(record.id));
        }
        for (const record of assessmentRows) {
          if (record.learnerId === active.value) {
            await requestResult(assessments.delete(record.id));
          }
        }
        for (const record of masteryRows) {
          if (record.learnerId === active.value) {
            await requestResult(
              mastery.delete([record.learnerId, record.curriculumReleaseId, record.skillId])
            );
          }
        }
        for (const record of practiceRows) {
          if (record.learnerId === active.value) await requestResult(practice.delete(record.id));
        }
        for (const record of evidenceRows) {
          if (record.learnerId === active.value) await requestResult(evidence.delete(record.id));
        }
        await requestResult(profiles.delete(active.value));
      }

      const fresh = createEmptyLocalLearnerProfile(crypto.randomUUID(), Date.now());
      await requestResult(profiles.add(fresh));
      await requestResult(
        metadata.put({ key: 'activeLearnerId', value: fresh.id })
      );
      await completed;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }
      await completed.catch(() => undefined);
      throw error;
    }
  } finally {
    database.close();
  }
}
