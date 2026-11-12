import {
  finishPracticeSession,
  recordPracticeEvidence,
  pausePracticeSession,
  resumePracticeSession,
  startPracticeSession
} from '../application/services';
import {
  createIndexedDbRepositories,
  ensureActiveLearnerProfile,
  openLocalDatabase
} from './indexeddb';
import { systemRuntime } from '../repositories/contracts';
import type {
  PracticeEvidenceRecord,
  PracticeSessionRecord
} from '../repositories/contracts';
import type { PracticeEvidenceSubmission } from '../domain/learning/practice-evidence';

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

/** Append one validated observation to a session owned by the active learner. */
export async function recordActivePracticeEvidence(
  submission: PracticeEvidenceSubmission
): Promise<PracticeEvidenceRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    return await recordPracticeEvidence(
      { learnerId: profile.id, submission },
      {
        practice: repositories.practice,
        evidence: repositories.practiceEvidence,
        runtime: systemRuntime
      }
    );
  } finally {
    database.close();
  }
}

/** List immutable observations for one of the active learner's sessions. */
export async function listActivePracticeEvidence(
  sessionId: string
): Promise<PracticeEvidenceRecord[]> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const session = await repositories.practice.findById(sessionId);
    if (!session || session.learnerId !== profile.id) {
      throw new Error('Practice session not found on this learner profile.');
    }
    return repositories.practiceEvidence.listBySession(profile.id, sessionId);
  } finally {
    database.close();
  }
}

/** Pause the current active segment and persist accumulated active time. */
export async function pauseActivePracticeSession(
  sessionId: string
): Promise<PracticeSessionRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    return await pausePracticeSession(
      { learnerId: profile.id, sessionId },
      { practice: repositories.practice, runtime: systemRuntime }
    );
  } finally {
    database.close();
  }
}

/** Resume a paused session without counting the time spent paused. */
export async function resumeActivePracticeSession(
  sessionId: string
): Promise<PracticeSessionRecord> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    return await resumePracticeSession(
      { learnerId: profile.id, sessionId },
      { practice: repositories.practice, runtime: systemRuntime }
    );
  } finally {
    database.close();
  }
}

/** Complete the active learner's session using accumulated active time. */
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
    const now = systemRuntime.now();
    const segmentStartedAt = current.activeStartedAt ?? current.startedAt;
    const elapsed =
      current.actualDurationSeconds +
      (current.status === 'in_progress'
        ? Math.floor((now - segmentStartedAt) / 1000)
        : 0);
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
