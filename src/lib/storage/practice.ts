import {
  finishPracticeSession,
  startPracticeSession
} from '../application/services';
import {
  createIndexedDbRepositories,
  ensureActiveLearnerProfile,
  openLocalDatabase
} from './indexeddb';
import { systemRuntime } from '../repositories/contracts';
import type { PracticeSessionRecord } from '../repositories/contracts';

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('Could not read practice history.'));
  });
}

/** Read only the active learner's local practice history. */
export async function listActivePracticeSessions(): Promise<
  PracticeSessionRecord[]
> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const transaction = database.transaction(['practiceSessions'], 'readonly');
    const request = transaction
      .objectStore('practiceSessions')
      .index('byLearnerId')
      .getAll(IDBKeyRange.only(profile.id));
    const records = await requestResult<PracticeSessionRecord[]>(request);
    return records.sort(
      (left, right) =>
        right.startedAt - left.startedAt || right.id.localeCompare(left.id)
    );
  } finally {
    database.close();
  }
}

/** Start a local session. Lesson association is added with exercise sequencing. */
export async function startActivePracticeSession(input: {
  plannedMinutes: number | null;
  focus: string | null;
}): Promise<PracticeSessionRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const existing = await requestResult<PracticeSessionRecord[]>(
      database
        .transaction(['practiceSessions'], 'readonly')
        .objectStore('practiceSessions')
        .index('byLearnerId')
        .getAll(IDBKeyRange.only(profile.id))
    );
    if (existing.some((session) => session.status === 'in_progress')) {
      throw new Error(
        'Finish your active practice session before starting another.'
      );
    }

    return await startPracticeSession(
      {
        learnerId: profile.id,
        plannedMinutes: input.plannedMinutes,
        primaryCurriculumReleaseId: null,
        primaryLessonId: null,
        focus: input.focus
      },
      {
        curriculum: {
          findRelease: async () => null,
          listLessons: async () => [],
          findLesson: async () => null
        },
        practice: repositories.practice,
        runtime: systemRuntime
      }
    );
  } finally {
    database.close();
  }
}

/** Complete the active learner's session using elapsed wall-clock time. */
export async function finishActivePracticeSession(
  sessionId: string
): Promise<PracticeSessionRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const current = await repositories.practice.findById(sessionId);
    if (!current || current.learnerId !== profile.id) {
      throw new Error('Practice session not found on this learner profile.');
    }
    const elapsed = Math.floor(
      (systemRuntime.now() - current.startedAt) / 1000
    );
    if (elapsed < 1 || elapsed > 43_200) {
      throw new Error(
        'A session must last between 1 second and 12 hours to be saved.'
      );
    }
    return await finishPracticeSession(
      { learnerId: profile.id, sessionId, actualDurationSeconds: elapsed },
      { practice: repositories.practice, runtime: systemRuntime }
    );
  } finally {
    database.close();
  }
}
