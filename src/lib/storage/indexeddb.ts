import {
  createEmptyProfilePreferences,
  profilePreferencesSchema,
  type ProfilePreferences
} from '../domain/profile/preferences';
import { updateLearnerPreferences } from '../application/services';
import { systemRuntime } from '../repositories/contracts';
import type {
  AssessmentAttemptRecord,
  AssessmentAttemptRepository,
  LearnerProfileRecord,
  LearnerProfileRepository,
  LessonProgressRecord,
  LessonProgressRepository,
  PracticeSessionRecord,
  PracticeSessionRepository,
  SkillMasteryRecord,
  SkillMasteryRepository
} from '../repositories/contracts';

export const LOCAL_DATABASE_NAME = 'guitarlab-local';
export const LOCAL_DATABASE_VERSION = 1;

const stores = {
  metadata: 'metadata',
  profiles: 'learnerProfiles',
  progress: 'lessonProgress',
  completionEvents: 'lessonCompletionEvents',
  assessmentAttempts: 'assessmentAttempts',
  mastery: 'skillMastery',
  practiceSessions: 'practiceSessions'
} as const;

type MetadataRecord = { key: string; value: string };
const ACTIVE_PROFILE_KEY = 'activeLearnerId';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Local database request failed.'));
  });
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () =>
      reject(transaction.error ?? new Error('Local database transaction aborted.'));
    transaction.onerror = () =>
      reject(transaction.error ?? new Error('Local database transaction failed.'));
  });
}

async function inTransaction<T>(
  database: IDBDatabase,
  storeNames: string[],
  mode: IDBTransactionMode,
  action: (transaction: IDBTransaction) => Promise<T>
): Promise<T> {
  const transaction = database.transaction(storeNames, mode);
  const completed = transactionResult(transaction);

  try {
    const result = await action(transaction);
    await completed;
    return result;
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // The transaction may already have aborted or completed.
    }
    await completed.catch(() => undefined);
    throw error;
  }
}

/** Open the versioned, browser-local store. No server or network binding is used. */
export function openLocalDatabase(
  databaseName = LOCAL_DATABASE_NAME
): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(
      new Error('This browser does not provide IndexedDB local storage.')
    );
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, LOCAL_DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(stores.metadata)) {
        database.createObjectStore(stores.metadata, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(stores.profiles)) {
        const profiles = database.createObjectStore(stores.profiles, {
          keyPath: 'id'
        });
        profiles.createIndex('byUpdatedAt', 'updatedAt');
      }
      if (!database.objectStoreNames.contains(stores.progress)) {
        const progress = database.createObjectStore(stores.progress, {
          keyPath: 'id'
        });
        progress.createIndex('byLearnerId', 'learnerId');
        progress.createIndex(
          'byLearnerReleaseLesson',
          ['learnerId', 'curriculumReleaseId', 'lessonId'],
          { unique: true }
        );
      }
      if (!database.objectStoreNames.contains(stores.completionEvents)) {
        const events = database.createObjectStore(stores.completionEvents, {
          keyPath: 'id'
        });
        events.createIndex('byProgressId', 'progressId');
        events.createIndex(
          'byLearnerCompletedAt',
          ['learnerId', 'completedAt']
        );
      }
      if (!database.objectStoreNames.contains(stores.assessmentAttempts)) {
        const attempts = database.createObjectStore(stores.assessmentAttempts, {
          keyPath: 'id'
        });
        attempts.createIndex(
          'byLearnerReleaseSkill',
          ['learnerId', 'curriculumReleaseId', 'skillId']
        );
      }
      if (!database.objectStoreNames.contains(stores.mastery)) {
        const mastery = database.createObjectStore(stores.mastery, {
          keyPath: ['learnerId', 'curriculumReleaseId', 'skillId']
        });
        mastery.createIndex('byLearnerId', 'learnerId');
      }
      if (!database.objectStoreNames.contains(stores.practiceSessions)) {
        const sessions = database.createObjectStore(stores.practiceSessions, {
          keyPath: 'id'
        });
        sessions.createIndex('byLearnerId', 'learnerId');
        sessions.createIndex('byStatus', 'status');
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open local learner storage.'));
    request.onblocked = () =>
      reject(new Error('Close other GuitarLab tabs to finish the storage upgrade.'));
  });
}

/** Stable factory makes the fresh-profile invariant independently testable. */
export function createEmptyLocalLearnerProfile(
  id: string,
  now: number
): LearnerProfileRecord {
  return {
    id,
    preferencesSchemaVersion: 1,
    preferences: createEmptyProfilePreferences(),
    createdAt: now,
    updatedAt: now,
    lastActiveAt: null
  };
}

/**
 * Create or retrieve the one active profile in a single read/write transaction.
 * This prevents two first-open tabs from creating separate active profiles.
 */
export async function ensureActiveLearnerProfile(
  database: IDBDatabase
): Promise<LearnerProfileRecord> {
  return inTransaction(
    database,
    [stores.metadata, stores.profiles],
    'readwrite',
    async (transaction) => {
      const metadata = transaction.objectStore(stores.metadata);
      const profiles = transaction.objectStore(stores.profiles);
      const active = await requestResult<MetadataRecord | undefined>(
        metadata.get(ACTIVE_PROFILE_KEY)
      );

      if (active) {
        const existing = await requestResult<LearnerProfileRecord | undefined>(
          profiles.get(active.value)
        );
        if (existing) {
          return {
            ...existing,
            preferences: profilePreferencesSchema.parse(existing.preferences)
          };
        }
      }

      const profile = createEmptyLocalLearnerProfile(
        crypto.randomUUID(),
        Date.now()
      );
      profiles.add(profile);
      metadata.put({ key: ACTIVE_PROFILE_KEY, value: profile.id } satisfies MetadataRecord);
      return profile;
    }
  );
}

export type IndexedDbRepositories = {
  profiles: LearnerProfileRepository;
  progress: LessonProgressRepository;
  assessments: AssessmentAttemptRepository;
  mastery: SkillMasteryRepository;
  practice: PracticeSessionRepository;
};

/** IndexedDB adapters implement the same ports used by the application layer. */
export function createIndexedDbRepositories(
  database: IDBDatabase
): IndexedDbRepositories {
  const profiles: LearnerProfileRepository = {
    create: async (profile) => {
      await inTransaction(database, [stores.profiles], 'readwrite', async (tx) => {
        await requestResult(tx.objectStore(stores.profiles).add(profile));
      });
    },
    findById: async (learnerId) =>
      inTransaction(database, [stores.profiles], 'readonly', async (tx) => {
        const value = await requestResult<LearnerProfileRecord | undefined>(
          tx.objectStore(stores.profiles).get(learnerId)
        );
        return value
          ? { ...value, preferences: profilePreferencesSchema.parse(value.preferences) }
          : null;
      }),
    updatePreferences: async (learnerId, preferences, updatedAt) =>
      inTransaction(database, [stores.profiles], 'readwrite', async (tx) => {
        const store = tx.objectStore(stores.profiles);
        const current = await requestResult<LearnerProfileRecord | undefined>(
          store.get(learnerId)
        );
        if (!current) return null;
        const updated: LearnerProfileRecord = {
          ...current,
          preferences: profilePreferencesSchema.parse(preferences),
          preferencesSchemaVersion: 1,
          updatedAt
        };
        await requestResult(store.put(updated));
        return updated;
      })
  };

  const progress: LessonProgressRepository = {
    find: async (learnerId, releaseId, lessonId) =>
      inTransaction(database, [stores.progress], 'readonly', async (tx) => {
        const index = tx.objectStore(stores.progress).index('byLearnerReleaseLesson');
        const value = await requestResult<LessonProgressRecord | undefined>(
          index.get(IDBKeyRange.only([learnerId, releaseId, lessonId]))
        );
        return value ?? null;
      }),
    create: async (record) => {
      await inTransaction(database, [stores.progress], 'readwrite', async (tx) => {
        await requestResult(tx.objectStore(stores.progress).add(record));
      });
    },
    completeWithEvent: async (record, event) =>
      inTransaction(
        database,
        [stores.progress, stores.completionEvents],
        'readwrite',
        async (tx) => {
          await requestResult(tx.objectStore(stores.progress).put(record));
          await requestResult(tx.objectStore(stores.completionEvents).add(event));
          return record;
        }
      )
  };

  const assessments: AssessmentAttemptRepository = {
    append: async (record) => {
      await inTransaction(database, [stores.assessmentAttempts], 'readwrite', async (tx) => {
        await requestResult(tx.objectStore(stores.assessmentAttempts).add(record));
      });
    },
    listBySkill: async (learnerId, releaseId, skillId) =>
      inTransaction(database, [stores.assessmentAttempts], 'readonly', async (tx) => {
        const index = tx.objectStore(stores.assessmentAttempts).index('byLearnerReleaseSkill');
        return requestResult<AssessmentAttemptRecord[]>(
          index.getAll(IDBKeyRange.only([learnerId, releaseId, skillId]))
        );
      }),
    findById: async (attemptId) =>
      inTransaction(database, [stores.assessmentAttempts], 'readonly', async (tx) => {
        const record = await requestResult<AssessmentAttemptRecord | undefined>(
          tx.objectStore(stores.assessmentAttempts).get(attemptId)
        );
        return record ?? null;
      })
  };

  const mastery: SkillMasteryRepository = {
    find: async (learnerId, releaseId, skillId) =>
      inTransaction(database, [stores.mastery], 'readonly', async (tx) => {
        const value = await requestResult<SkillMasteryRecord | undefined>(
          tx.objectStore(stores.mastery).get([learnerId, releaseId, skillId])
        );
        return value ?? null;
      }),
    save: async (snapshot) => {
      await inTransaction(database, [stores.mastery], 'readwrite', async (tx) => {
        await requestResult(tx.objectStore(stores.mastery).put(snapshot));
      });
    }
  };

  const practice: PracticeSessionRepository = {
    create: async (session) => {
      await inTransaction(database, [stores.practiceSessions], 'readwrite', async (tx) => {
        await requestResult(tx.objectStore(stores.practiceSessions).add(session));
      });
    },
    findById: async (sessionId) =>
      inTransaction(database, [stores.practiceSessions], 'readonly', async (tx) => {
        const value = await requestResult<PracticeSessionRecord | undefined>(
          tx.objectStore(stores.practiceSessions).get(sessionId)
        );
        return value ?? null;
      }),
    updateIfInProgress: async (session) =>
      inTransaction(database, [stores.practiceSessions], 'readwrite', async (tx) => {
        const store = tx.objectStore(stores.practiceSessions);
        const current = await requestResult<PracticeSessionRecord | undefined>(
          store.get(session.id)
        );
        if (!current || current.status !== 'in_progress') return false;
        await requestResult(store.put(session));
        return true;
      })
  };

  return { profiles, progress, assessments, mastery, practice };
}

/** Entry point used only by client-side lifecycle hooks and user actions. */
export async function loadActiveLearnerProfile(): Promise<LearnerProfileRecord> {
  const database = await openLocalDatabase();
  try {
    return await ensureActiveLearnerProfile(database);
  } finally {
    database.close();
  }
}

/** Validate and persist profile preferences locally; never sends them to a server. */
export async function saveActiveLearnerPreferences(
  preferences: ProfilePreferences
): Promise<LearnerProfileRecord> {
  const database = await openLocalDatabase();
  try {
    const active = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    return await updateLearnerPreferences(
      { learnerId: active.id, preferences },
      { profiles: repositories.profiles, runtime: systemRuntime }
    );
  } finally {
    database.close();
  }
}
