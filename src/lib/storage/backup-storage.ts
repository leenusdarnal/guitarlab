import {
  openLocalDatabase,
  ensureActiveLearnerProfile
} from './indexeddb';
import {
  LEARNER_BACKUP_FORMAT,
  LEARNER_BACKUP_VERSION,
  learnerBackupSchema,
  type LearnerBackup
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

export type LearnerBackupSource = {
  profiles: LearnerProfileRecord[];
  lessonProgress: LessonProgressRecord[];
  completionEvents: LessonCompletionEventRecord[];
  assessmentAttempts: AssessmentAttemptRecord[];
  skillMastery: SkillMasteryRecord[];
  practiceSessions: PracticeSessionRecord[];
  practiceEvidence: PracticeEvidenceRecord[];
};

/** Build a portable snapshot from store rows, retaining only one learner's data. */
export function buildLearnerBackup(
  learnerId: string,
  exportedAt: number,
  source: LearnerBackupSource
): LearnerBackup {
  const profile = source.profiles.find((record) => record.id === learnerId);
  if (!profile) {
    throw new Error('The active learner profile could not be found for export.');
  }

  const owned = <T extends { learnerId: string }>(records: T[]) =>
    records.filter((record) => record.learnerId === learnerId);

  return learnerBackupSchema.parse({
    format: LEARNER_BACKUP_FORMAT,
    version: LEARNER_BACKUP_VERSION,
    exportedAt,
    learnerId,
    records: {
      profile,
      lessonProgress: owned(source.lessonProgress),
      completionEvents: owned(source.completionEvents),
      assessmentAttempts: owned(source.assessmentAttempts),
      skillMastery: owned(source.skillMastery),
      practiceSessions: owned(source.practiceSessions),
      practiceEvidence: owned(source.practiceEvidence)
    }
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not read local learner data.'));
  });
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('The backup read was aborted.'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('The backup read failed.'));
  });
}

/** Read all learner stores in one readonly transaction; nothing leaves the device. */
export async function exportActiveLearnerBackup(
  exportedAt = Date.now()
): Promise<LearnerBackup> {
  const database = await openLocalDatabase();
  try {
    const active = await ensureActiveLearnerProfile(database);
    const transaction = database.transaction(
      [
        'learnerProfiles',
        'lessonProgress',
        'lessonCompletionEvents',
        'assessmentAttempts',
        'skillMastery',
        'practiceSessions',
        'practiceEvidence'
      ],
      'readonly'
    );
    const completed = transactionResult(transaction);

    try {
      const [profiles, lessonProgress, completionEvents, assessmentAttempts, skillMastery, practiceSessions, practiceEvidence] =
        await Promise.all([
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
        ] as const);

      await completed;
      return buildLearnerBackup(active.id, exportedAt, {
        profiles,
        lessonProgress,
        completionEvents,
        assessmentAttempts,
        skillMastery,
        practiceSessions,
        practiceEvidence
      });
    } catch (error) {
      await completed.catch(() => undefined);
      throw error;
    }
  } finally {
    database.close();
  }
}
