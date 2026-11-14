import {
  createEmptyProfilePreferences,
  profilePreferencesSchema,
  type ProfilePreferences
} from '../domain/profile/preferences';
import {
  completeLesson,
  correctSkillMasteryState,
  updateLearnerPreferences,
  updateLessonProgress
} from '../application/services';
import { buildDashboardSnapshot } from '../application/dashboard';
import { buildAdaptivePracticeSnapshot } from '../application/adaptive-practice';
import { adaptiveRecommendationFeedbackSchema } from '../domain/learning/adaptive-recommendation-feedback';
import type { AdaptivePracticeSnapshot } from '../application/adaptive-practice';
import {
  ACTIVE_CURRICULUM_RELEASE_ID,
  listSkillsForLessons
} from '../application/skill-catalog';
import {
  listAuthoredPracticeDimensions,
  listAuthoredPracticeScopeSnapshots
} from '../application/practice-taxonomy';
import { explainSkillState } from '../domain/learning/skill-state';
import type { SkillStateExplanation } from '../domain/learning/skill-state';
import year1DashboardIndex from '../../../content/curriculum/year-1-dashboard-index.json';
import { systemRuntime } from '../repositories/contracts';
import type { AdaptiveRecommendationFeedbackRecord } from '../domain/learning/adaptive-recommendation-feedback';
import type {
  AdaptiveRecommendationFeedbackRepository,
  AssessmentAttemptRecord,
  AssessmentAttemptRepository,
  PracticeEvidenceRecord,
  PracticeEvidenceRepository,
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
export const LOCAL_DATABASE_VERSION = 6;

const stores = {
  metadata: 'metadata',
  profiles: 'learnerProfiles',
  progress: 'lessonProgress',
  completionEvents: 'lessonCompletionEvents',
  assessmentAttempts: 'assessmentAttempts',
  mastery: 'skillMastery',
  practiceSessions: 'practiceSessions',
  practiceEvidence: 'practiceEvidence',
  adaptiveRecommendationFeedback: 'adaptiveRecommendationFeedback'
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
      reject(
        transaction.error ?? new Error('Local database transaction aborted.')
      );
    transaction.onerror = () =>
      reject(
        transaction.error ?? new Error('Local database transaction failed.')
      );
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
        events.createIndex('byLearnerCompletedAt', [
          'learnerId',
          'completedAt'
        ]);
      }
      const attempts = database.objectStoreNames.contains(
        stores.assessmentAttempts
      )
        ? request.transaction!.objectStore(stores.assessmentAttempts)
        : database.createObjectStore(stores.assessmentAttempts, {
            keyPath: 'id'
          });
      if (!attempts.indexNames.contains('byLearnerReleaseSkill')) {
        attempts.createIndex('byLearnerReleaseSkill', [
          'learnerId',
          'curriculumReleaseId',
          'skillId'
        ]);
      }
      if (!attempts.indexNames.contains('byLearnerRelease')) {
        attempts.createIndex('byLearnerRelease', [
          'learnerId',
          'curriculumReleaseId'
        ]);
      }
      if (!database.objectStoreNames.contains(stores.mastery)) {
        const mastery = database.createObjectStore(stores.mastery, {
          keyPath: ['learnerId', 'curriculumReleaseId', 'skillId']
        });
        mastery.createIndex('byLearnerId', 'learnerId');
      }
      const sessions = database.objectStoreNames.contains(
        stores.practiceSessions
      )
        ? request.transaction!.objectStore(stores.practiceSessions)
        : database.createObjectStore(stores.practiceSessions, {
            keyPath: 'id'
          });
      if (!sessions.indexNames.contains('byLearnerId')) {
        sessions.createIndex('byLearnerId', 'learnerId');
      }
      if (!sessions.indexNames.contains('byStatus')) {
        sessions.createIndex('byStatus', 'status');
      }
      // M7 practice creation must inspect only this learner's active/paused sessions.
      if (!sessions.indexNames.contains('byLearnerStatus')) {
        sessions.createIndex('byLearnerStatus', ['learnerId', 'status']);
      }
      // M7 session history needs an efficient learner/status/time lookup.
      if (!sessions.indexNames.contains('byLearnerStatusStartedAt')) {
        sessions.createIndex('byLearnerStatusStartedAt', [
          'learnerId',
          'status',
          'startedAt'
        ]);
      }
      const evidence = database.objectStoreNames.contains(
        stores.practiceEvidence
      )
        ? request.transaction!.objectStore(stores.practiceEvidence)
        : database.createObjectStore(stores.practiceEvidence, {
            keyPath: 'id'
          });
      if (!evidence.indexNames.contains('byLearnerSession')) {
        evidence.createIndex('byLearnerSession', ['learnerId', 'sessionId']);
      }
      if (!evidence.indexNames.contains('byLearnerId')) {
        evidence.createIndex('byLearnerId', 'learnerId');
      }
      if (
        !database.objectStoreNames.contains(
          stores.adaptiveRecommendationFeedback
        )
      ) {
        const feedback = database.createObjectStore(
          stores.adaptiveRecommendationFeedback,
          { keyPath: 'id' }
        );
        feedback.createIndex('byLearnerRelease', [
          'learnerId',
          'curriculumReleaseId'
        ]);
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error('Could not open local learner storage.')
      );
    request.onblocked = () =>
      reject(
        new Error('Close other GuitarLab tabs to finish the storage upgrade.')
      );
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
      metadata.put({
        key: ACTIVE_PROFILE_KEY,
        value: profile.id
      } satisfies MetadataRecord);
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
  practiceEvidence: PracticeEvidenceRepository;
  adaptiveRecommendationFeedback: AdaptiveRecommendationFeedbackRepository;
};

/** IndexedDB adapters implement the same ports used by the application layer. */
export function createIndexedDbRepositories(
  database: IDBDatabase
): IndexedDbRepositories {
  const profiles: LearnerProfileRepository = {
    create: async (profile) => {
      await inTransaction(
        database,
        [stores.profiles],
        'readwrite',
        async (tx) => {
          await requestResult(tx.objectStore(stores.profiles).add(profile));
        }
      );
    },
    findById: async (learnerId) =>
      inTransaction(database, [stores.profiles], 'readonly', async (tx) => {
        const value = await requestResult<LearnerProfileRecord | undefined>(
          tx.objectStore(stores.profiles).get(learnerId)
        );
        return value
          ? {
              ...value,
              preferences: profilePreferencesSchema.parse(value.preferences)
            }
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
        const index = tx
          .objectStore(stores.progress)
          .index('byLearnerReleaseLesson');
        const value = await requestResult<LessonProgressRecord | undefined>(
          index.get([learnerId, releaseId, lessonId])
        );
        return value ?? null;
      }),
    create: async (record) => {
      await inTransaction(
        database,
        [stores.progress],
        'readwrite',
        async (tx) => {
          await requestResult(tx.objectStore(stores.progress).add(record));
        }
      );
    },
    updateInProgress: async (record, expectedRevision) =>
      inTransaction(database, [stores.progress], 'readwrite', async (tx) => {
        const store = tx.objectStore(stores.progress);
        const current = await requestResult<LessonProgressRecord | undefined>(
          store
            .index('byLearnerReleaseLesson')
            .get([
              record.learnerId,
              record.curriculumReleaseId,
              record.lessonId
            ])
        );
        if (
          !current ||
          current.status !== 'in_progress' ||
          current.id !== record.id ||
          (current.revision ?? 0) !== expectedRevision
        ) {
          return false;
        }
        await requestResult(store.put(record));
        return true;
      }),
    completeWithEvent: async (record, event, expectedRevision) =>
      inTransaction(
        database,
        [stores.progress, stores.completionEvents],
        'readwrite',
        async (tx) => {
          const progressStore = tx.objectStore(stores.progress);
          const current = await requestResult<LessonProgressRecord | undefined>(
            progressStore.get(record.id)
          );
          if (
            !current ||
            current.status !== 'in_progress' ||
            (current.revision ?? 0) !== expectedRevision ||
            (event.completionSource === 'checkpoint' &&
              current.checkpointOutcome !== 'achieved')
          ) {
            return null;
          }

          await requestResult(progressStore.put(record));
          await requestResult(
            tx.objectStore(stores.completionEvents).add(event)
          );
          return record;
        }
      )
  };

  const assessments: AssessmentAttemptRepository = {
    append: async (record) => {
      await inTransaction(
        database,
        [stores.assessmentAttempts],
        'readwrite',
        async (tx) => {
          await requestResult(
            tx.objectStore(stores.assessmentAttempts).add(record)
          );
        }
      );
    },
    listBySkill: async (learnerId, releaseId, skillId) =>
      inTransaction(
        database,
        [stores.assessmentAttempts],
        'readonly',
        async (tx) => {
          const index = tx
            .objectStore(stores.assessmentAttempts)
            .index('byLearnerReleaseSkill');
          return requestResult<AssessmentAttemptRecord[]>(
            index.getAll(IDBKeyRange.only([learnerId, releaseId, skillId]))
          );
        }
      ),
    findById: async (attemptId) =>
      inTransaction(
        database,
        [stores.assessmentAttempts],
        'readonly',
        async (tx) => {
          const record = await requestResult<
            AssessmentAttemptRecord | undefined
          >(tx.objectStore(stores.assessmentAttempts).get(attemptId));
          return record ?? null;
        }
      )
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
      await inTransaction(
        database,
        [stores.mastery],
        'readwrite',
        async (tx) => {
          await requestResult(tx.objectStore(stores.mastery).put(snapshot));
        }
      );
    }
  };

  const practice: PracticeSessionRepository = {
    create: async (session) => {
      await inTransaction(
        database,
        [stores.practiceSessions],
        'readwrite',
        async (tx) => {
          const store = tx.objectStore(stores.practiceSessions);
          // IndexedDB serializes read/write transactions across tabs.
          const activeStatuses = store.index('byLearnerStatus');
          const [inProgress, paused] = await Promise.all([
            requestResult<PracticeSessionRecord[]>(
              activeStatuses.getAll([session.learnerId, 'in_progress'])
            ),
            requestResult<PracticeSessionRecord[]>(
              activeStatuses.getAll([session.learnerId, 'paused'])
            )
          ]);
          if (inProgress.length > 0 || paused.length > 0) {
            throw new Error(
              'Finish or resume your existing practice session before starting another.'
            );
          }
          await requestResult(store.add(session));
        }
      );
    },
    findById: async (sessionId) =>
      inTransaction(
        database,
        [stores.practiceSessions],
        'readonly',
        async (tx) => {
          const value = await requestResult<PracticeSessionRecord | undefined>(
            tx.objectStore(stores.practiceSessions).get(sessionId)
          );
          return value ?? null;
        }
      ),
    updateIfStatus: async (session, expectedStatus) =>
      inTransaction(
        database,
        [stores.practiceSessions],
        'readwrite',
        async (tx) => {
          const store = tx.objectStore(stores.practiceSessions);
          const current = await requestResult<
            PracticeSessionRecord | undefined
          >(store.get(session.id));
          if (!current || current.status !== expectedStatus) return false;
          await requestResult(store.put(session));
          return true;
        }
      )
  };

  const practiceEvidence: PracticeEvidenceRepository = {
    append: async (record) =>
      inTransaction(
        database,
        [stores.practiceEvidence, stores.practiceSessions],
        'readwrite',
        async (tx) => {
          const session = await requestResult<
            PracticeSessionRecord | undefined
          >(tx.objectStore(stores.practiceSessions).get(record.sessionId));
          if (
            !session ||
            session.learnerId !== record.learnerId ||
            session.status === 'abandoned'
          ) {
            throw new Error(
              'Practice evidence must reference a session owned by this learner.'
            );
          }
          const hasAuthoredExercise = Boolean(session.primaryExerciseId);
          const expectedIdentity = {
            curriculumReleaseId: hasAuthoredExercise
              ? session.primaryCurriculumReleaseId
              : null,
            lessonId: hasAuthoredExercise ? session.primaryLessonId : null,
            authoredExerciseId: hasAuthoredExercise
              ? session.primaryExerciseId
              : null,
            practiceTaxonomyVersion: hasAuthoredExercise
              ? session.practiceTaxonomyVersion
              : null
          };
          const actualIdentity = {
            curriculumReleaseId: record.curriculumReleaseId ?? null,
            lessonId: record.lessonId ?? null,
            authoredExerciseId: record.authoredExerciseId ?? null,
            practiceTaxonomyVersion: record.practiceTaxonomyVersion ?? null
          };
          if (
            JSON.stringify(actualIdentity) !== JSON.stringify(expectedIdentity)
          ) {
            throw new Error(
              'Practice evidence authored exercise identity must match its session.'
            );
          }
          // add(), not put(), makes the repository append-only.
          await requestResult(
            tx.objectStore(stores.practiceEvidence).add(record)
          );
        }
      ),
    listBySession: (learnerId, sessionId) =>
      inTransaction(
        database,
        [stores.practiceEvidence],
        'readonly',
        async (tx) => {
          const records = await requestResult<PracticeEvidenceRecord[]>(
            tx
              .objectStore(stores.practiceEvidence)
              .index('byLearnerSession')
              .getAll([learnerId, sessionId])
          );
          return records.sort(
            (left, right) =>
              left.recordedAt - right.recordedAt ||
              left.id.localeCompare(right.id)
          );
        }
      )
  };

  const adaptiveRecommendationFeedback: AdaptiveRecommendationFeedbackRepository =
    {
      append: async (record) =>
        inTransaction(
          database,
          [stores.adaptiveRecommendationFeedback, stores.profiles],
          'readwrite',
          async (tx) => {
            const validated =
              adaptiveRecommendationFeedbackSchema.parse(record);
            const owner = await requestResult<LearnerProfileRecord | undefined>(
              tx.objectStore(stores.profiles).get(validated.learnerId)
            );
            if (!owner) {
              throw new Error(
                'Adaptive recommendation feedback must belong to a saved learner profile.'
              );
            }
            // add(), never put(), preserves a complete, append-only decision history.
            await requestResult(
              tx
                .objectStore(stores.adaptiveRecommendationFeedback)
                .add(validated)
            );
          }
        ),
      listByLearnerRelease: (learnerId, releaseId) =>
        inTransaction(
          database,
          [stores.adaptiveRecommendationFeedback],
          'readonly',
          async (tx) => {
            const records = await requestResult<
              AdaptiveRecommendationFeedbackRecord[]
            >(
              tx
                .objectStore(stores.adaptiveRecommendationFeedback)
                .index('byLearnerRelease')
                .getAll([learnerId, releaseId])
            );
            return records.sort(
              (left, right) =>
                left.createdAt - right.createdAt ||
                left.id.localeCompare(right.id)
            );
          }
        )
    };

  return {
    profiles,
    progress,
    assessments,
    mastery,
    practice,
    practiceEvidence,
    adaptiveRecommendationFeedback
  };
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

/** Read or create local progress for one authored lesson. */
export async function loadActiveLessonProgress(
  lessonId: string,
  allowedBlockIds: string[],
  releaseId = 'curriculum-v1'
): Promise<LessonProgressRecord> {
  if (!lessonId || lessonId.length > 160 || allowedBlockIds.length > 200) {
    throw new Error('The lesson progress request is invalid.');
  }

  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repository = createIndexedDbRepositories(database).progress;
    const normalize = (record: LessonProgressRecord): LessonProgressRecord => ({
      ...record,
      lastBlockId:
        record.lastBlockId && allowedBlockIds.includes(record.lastBlockId)
          ? record.lastBlockId
          : null,
      completedBlockIds: (record.completedBlockIds ?? []).filter((id) =>
        allowedBlockIds.includes(id)
      ),
      checkpointOutcome: record.checkpointOutcome ?? null,
      checkpointNote: record.checkpointNote ?? null,
      revision: record.revision ?? 0
    });

    const existing = await repository.find(profile.id, releaseId, lessonId);
    if (existing) return normalize(existing);

    const now = systemRuntime.now();
    const created: LessonProgressRecord = {
      id: systemRuntime.newId(),
      learnerId: profile.id,
      curriculumReleaseId: releaseId,
      lessonId,
      status: 'in_progress',
      lastBlockId: null,
      completedBlockIds: [],
      checkpointOutcome: null,
      checkpointNote: null,
      revision: 0,
      startedAt: now,
      completedAt: null,
      updatedAt: now
    };

    try {
      await repository.create(created);
      return created;
    } catch (error) {
      // Multiple tabs can race; reuse the row that won the unique compound index.
      const concurrent = await repository.find(profile.id, releaseId, lessonId);
      if (concurrent) return normalize(concurrent);
      throw error;
    }
  } finally {
    database.close();
  }
}

/** Persist section progress and an optional learner-authored practice note locally. */
export async function saveActiveLessonProgress(
  lessonId: string,
  update: {
    expectedRevision: number;
    lastBlockId: string | null;
    completedBlockIds: string[];
    checkpointOutcome: 'achieved' | 'needs_practice' | null;
    checkpointNote: string | null;
  },
  allowedBlockIds: string[],
  releaseId = 'curriculum-v1'
): Promise<LessonProgressRecord> {
  const validIds = new Set(allowedBlockIds);
  if (
    !Number.isSafeInteger(update.expectedRevision) ||
    update.expectedRevision < 0 ||
    update.completedBlockIds.length > 200 ||
    new Set(update.completedBlockIds).size !==
      update.completedBlockIds.length ||
    update.completedBlockIds.some((id) => !validIds.has(id)) ||
    (update.lastBlockId !== null &&
      (!validIds.has(update.lastBlockId) ||
        !update.completedBlockIds.includes(update.lastBlockId))) ||
    (update.checkpointNote !== null && update.checkpointNote.length > 500)
  ) {
    throw new Error(
      'The lesson progress update contains invalid lesson content references.'
    );
  }

  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    return await updateLessonProgress(
      {
        learnerId: profile.id,
        releaseId,
        lessonId,
        ...update
      },
      {
        progress: repositories.progress,
        runtime: systemRuntime
      }
    );
  } finally {
    database.close();
  }
}

/** Completion requires a positive learner checkpoint self-check; it never grants mastery. */
export async function completeActiveLessonProgress(
  lessonId: string,
  releaseId = 'curriculum-v1'
): Promise<LessonProgressRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const current = await repositories.progress.find(
      profile.id,
      releaseId,
      lessonId
    );
    if (!current) {
      throw new Error('Start this lesson before marking it complete.');
    }
    if (current.status === 'completed') return current;
    if (current.checkpointOutcome !== 'achieved') {
      throw new Error(
        'Confirm that you can meet the lesson checkpoint before completing it.'
      );
    }

    return await completeLesson(
      {
        learnerId: profile.id,
        releaseId,
        lessonId,
        completionSource: 'checkpoint',
        lastBlockId: current.lastBlockId
      },
      { progress: repositories.progress, runtime: systemRuntime }
    );
  } finally {
    database.close();
  }
}

/** Build the dashboard from local learner evidence and the authored Year 1 route. */
export async function loadActiveLearnerDashboard() {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const snapshot = await inTransaction(
      database,
      [stores.progress, stores.mastery, stores.practiceSessions],
      'readonly',
      async (transaction) => {
        const progressRequest = transaction
          .objectStore(stores.progress)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));
        const masteryRequest = transaction
          .objectStore(stores.mastery)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));
        const practiceRequest = transaction
          .objectStore(stores.practiceSessions)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));

        const [progress, mastery, practiceSessions] = await Promise.all([
          requestResult<LessonProgressRecord[]>(progressRequest),
          requestResult<SkillMasteryRecord[]>(masteryRequest),
          requestResult<PracticeSessionRecord[]>(practiceRequest)
        ]);

        return buildDashboardSnapshot({
          profile,
          lessons: year1DashboardIndex.lessons,
          phases: year1DashboardIndex.phases,
          progress,
          mastery,
          practiceSessions,
          now: Date.now()
        });
      }
    );
    return snapshot;
  } finally {
    database.close();
  }
}

/**
 * Build recommendations/ from the active learner's local evidence and only
 * the explicitly mapped skills reached in the Year 1 dashboard route.
 * This is a read-only view; it never writes mastery or assessment records.
 */
export async function loadActiveAdaptivePracticeSnapshot(
  now = Date.now()
): Promise<AdaptivePracticeSnapshot> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    return await inTransaction(
      database,
      [
        stores.progress,
        stores.assessmentAttempts,
        stores.mastery,
        stores.practiceSessions,
        stores.practiceEvidence
      ],
      'readonly',
      async (transaction) => {
        const progressRequest = transaction
          .objectStore(stores.progress)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));
        const attemptsRequest = transaction
          .objectStore(stores.assessmentAttempts)
          .index('byLearnerRelease')
          .getAll([profile.id, ACTIVE_CURRICULUM_RELEASE_ID]);
        const masteryRequest = transaction
          .objectStore(stores.mastery)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));
        const sessionsRequest = transaction
          .objectStore(stores.practiceSessions)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));
        const evidenceRequest = transaction
          .objectStore(stores.practiceEvidence)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));

        const [
          allProgress,
          attempts,
          allMastery,
          practiceSessions,
          practiceEvidence
        ] = await Promise.all([
          requestResult<LessonProgressRecord[]>(progressRequest),
          requestResult<AssessmentAttemptRecord[]>(attemptsRequest),
          requestResult<SkillMasteryRecord[]>(masteryRequest),
          requestResult<PracticeSessionRecord[]>(sessionsRequest),
          requestResult<PracticeEvidenceRecord[]>(evidenceRequest)
        ]);

        const progress = allProgress.filter(
          (record) =>
            record.learnerId === profile.id &&
            record.curriculumReleaseId === ACTIVE_CURRICULUM_RELEASE_ID
        );
        const mastery = allMastery.filter(
          (record) =>
            record.learnerId === profile.id &&
            record.curriculumReleaseId === ACTIVE_CURRICULUM_RELEASE_ID
        );
        const dashboard = buildDashboardSnapshot({
          profile,
          lessons: year1DashboardIndex.lessons,
          phases: year1DashboardIndex.phases,
          progress,
          mastery,
          practiceSessions,
          now
        });
        const reachedLessonIds = new Set(
          progress
            .filter(
              (record) =>
                record.status === 'completed' || record.status === 'in_progress'
            )
            .map((record) => record.lessonId)
        );
        if (dashboard.nextLesson) {
          reachedLessonIds.add(dashboard.nextLesson.id);
        }

        return buildAdaptivePracticeSnapshot({
          learnerId: profile.id,
          curriculumReleaseId: ACTIVE_CURRICULUM_RELEASE_ID,
          skills: listSkillsForLessons([...reachedLessonIds]),
          attempts,
          mastery,
          practiceEvidence,
          authoredPracticeTaxonomies: listAuthoredPracticeScopeSnapshots(),
          authoredPracticeDimensions: listAuthoredPracticeDimensions(),
          now
        });
      }
    );
  } finally {
    database.close();
  }
}

/** Read only the active learner's append-only feedback for the current release. */
export async function loadActiveAdaptiveRecommendationFeedback(): Promise<
  AdaptiveRecommendationFeedbackRecord[]
> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    return await createIndexedDbRepositories(
      database
    ).adaptiveRecommendationFeedback.listByLearnerRelease(
      profile.id,
      ACTIVE_CURRICULUM_RELEASE_ID
    );
  } finally {
    database.close();
  }
}

export type RecordAdaptiveRecommendationFeedbackInput = Pick<
  AdaptiveRecommendationFeedbackRecord,
  | 'recommendationId'
  | 'targetType'
  | 'targetId'
  | 'reasonCodes'
  | 'action'
  | 'correction'
>;

/** Persist an auditable learner response locally; it cannot write mastery. */
export async function recordActiveAdaptiveRecommendationFeedback(
  input: RecordAdaptiveRecommendationFeedbackInput
): Promise<AdaptiveRecommendationFeedbackRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const record = adaptiveRecommendationFeedbackSchema.parse({
      ...input,
      id: systemRuntime.newId(),
      learnerId: profile.id,
      curriculumReleaseId: ACTIVE_CURRICULUM_RELEASE_ID,
      createdAt: systemRuntime.now()
    });
    await createIndexedDbRepositories(
      database
    ).adaptiveRecommendationFeedback.append(record);
    return record;
  } finally {
    database.close();
  }
}

export type ActiveSkillStateReview = {
  skillId: string;
  mastery: SkillMasteryRecord;
  explanation: SkillStateExplanation;
};

/** Read existing learner skill snapshots and explain each from its assessment history. */
export async function loadActiveSkillStateReview(): Promise<
  ActiveSkillStateReview[]
> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const records = await inTransaction(
      database,
      [stores.mastery, stores.assessmentAttempts],
      'readonly',
      async (transaction) => {
        const masteryRequest = transaction
          .objectStore(stores.mastery)
          .index('byLearnerId')
          .getAll(IDBKeyRange.only(profile.id));
        const mastery =
          await requestResult<SkillMasteryRecord[]>(masteryRequest);
        const attempts = await requestResult<AssessmentAttemptRecord[]>(
          transaction.objectStore(stores.assessmentAttempts).getAll()
        );
        return { mastery, attempts };
      }
    );
    return records.mastery
      .filter((record) => record.learnerId === profile.id)
      .map((mastery) => {
        const attempts = records.attempts.filter(
          (attempt) =>
            attempt.learnerId === profile.id &&
            attempt.curriculumReleaseId === mastery.curriculumReleaseId &&
            attempt.skillId === mastery.skillId
        );
        return {
          skillId: mastery.skillId,
          mastery,
          explanation: explainSkillState({
            attempts,
            current: mastery,
            now: Date.now()
          })
        };
      })
      .sort((left, right) => left.skillId.localeCompare(right.skillId));
  } finally {
    database.close();
  }
}

/** Persist a learner correction locally; only an already-known skill snapshot can be corrected. */
export async function correctActiveSkillState(input: {
  skillId: string;
  state: SkillMasteryRecord['state'];
  note: string;
}): Promise<SkillMasteryRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const existing = await repositories.mastery.find(
      profile.id,
      'curriculum-v1',
      input.skillId
    );
    if (!existing) {
      throw new Error('This skill has no saved learning state to correct yet.');
    }
    return await correctSkillMasteryState(
      {
        learnerId: profile.id,
        releaseId: existing.curriculumReleaseId,
        skillId: existing.skillId,
        state: input.state,
        confidence: existing.confidence,
        nextReviewAt: existing.nextReviewAt,
        note: input.note
      },
      {
        curriculum: {
          findRelease: async (releaseId) =>
            releaseId === existing.curriculumReleaseId
              ? {
                  id: releaseId,
                  version: releaseId,
                  schemaVersion: 1,
                  contentHash: 'local',
                  publishedAt: 0,
                  status: 'published'
                }
              : null,
          listLessons: async () => [],
          findLesson: async () => null
        },
        skills: {
          listForRelease: async () => [],
          findForRelease: async (releaseId, skillId) =>
            releaseId === existing.curriculumReleaseId &&
            skillId === existing.skillId
              ? {
                  id: skillId,
                  category: 'learner-skill',
                  displayName: skillId
                }
              : null
        },
        assessments: repositories.assessments,
        mastery: repositories.mastery,
        runtime: systemRuntime
      }
    );
  } finally {
    database.close();
  }
}
