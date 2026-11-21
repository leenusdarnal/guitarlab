import type { SongProjectRecord } from '../domain/repertoire/song-project';
import { describe, expect, it } from 'vitest';
import type {
  AdaptiveRecommendationFeedbackRecord,
  PracticeEvidenceRecord,
  LessonCompletionEventRecord,
  LessonProgressRecord,
  PracticeSessionRecord
} from '../repositories/contracts';
import {
  createEmptyLocalLearnerProfile,
  createIndexedDbRepositories,
  ensureActiveLearnerProfile,
  LOCAL_DATABASE_VERSION
} from './indexeddb';

type FakeRequest<T> = {
  result?: T;
  error: Error | null;
  onsuccess: ((event: Event) => void) | null;
  onerror: ((event: Event) => void) | null;
};

class FakeTransaction {
  oncomplete: ((event: Event) => void) | null = null;
  onabort: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  private pending = 0;
  private scheduled = false;
  private finished = false;

  constructor(private readonly data: Map<string, FakeStore>) {}

  objectStore(name: string) {
    const store = this.data.get(name);
    if (!store) throw new Error(`Missing fake object store: ${name}`);
    return store.attach(this);
  }

  request<T>(operation: () => T): IDBRequest<T> {
    const request: FakeRequest<T> = {
      result: undefined,
      error: null,
      onsuccess: null,
      onerror: null
    };
    this.pending += 1;
    queueMicrotask(() => {
      try {
        request.result = operation();
        request.onsuccess?.(new Event('success'));
      } catch (error) {
        request.error =
          error instanceof Error ? error : new Error('Request failed.');
        request.onerror?.(new Event('error'));
      } finally {
        this.pending -= 1;
        this.scheduleCompletion();
      }
    });
    return request as IDBRequest<T>;
  }

  abort() {
    this.finished = true;
    this.onabort?.(new Event('abort'));
  }

  private scheduleCompletion() {
    if (this.pending !== 0 || this.scheduled || this.finished) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (this.pending === 0 && !this.finished) {
        this.finished = true;
        this.oncomplete?.(new Event('complete'));
      }
    });
  }
}

class FakeStore {
  private transaction: FakeTransaction | null = null;
  private readonly records = new Map<string, unknown>();

  constructor(private readonly keyPath: string | string[]) {}

  attach(transaction: FakeTransaction) {
    this.transaction = transaction;
    return this;
  }

  get(key: IDBValidKey) {
    return this.tx().request(() => this.records.get(this.key(key)));
  }

  getAll() {
    return this.tx().request(() =>
      [...this.records.values()].map((value) => structuredClone(value))
    );
  }

  add(value: Record<string, unknown>) {
    return this.tx().request(() => {
      const key = this.keyFromValue(value);
      if (this.records.has(key)) throw new Error('Duplicate key');
      this.records.set(key, structuredClone(value));
      return key;
    });
  }

  put(value: Record<string, unknown>) {
    return this.tx().request(() => {
      const key = this.keyFromValue(value);
      this.records.set(key, structuredClone(value));
      return key;
    });
  }

  delete(key: IDBValidKey) {
    return this.tx().request(() => this.records.delete(this.key(key)));
  }

  index(name: string) {
    const fields =
      name === 'byLearnerReleaseLesson'
        ? ['learnerId', 'curriculumReleaseId', 'lessonId']
        : name === 'byLearnerReleaseSkill'
          ? ['learnerId', 'curriculumReleaseId', 'skillId']
          : name === 'byLearnerRelease'
            ? ['learnerId', 'curriculumReleaseId']
            : name === 'byLearnerSession'
              ? ['learnerId', 'sessionId']
              : name === 'byLearnerId'
                ? ['learnerId']
                : ['learnerId', 'status'];
    const matches = (record: unknown, key: IDBValidKey) => {
      const value = record as Record<string, unknown>;
      const candidate =
        fields.length === 1
          ? value[fields[0]]
          : fields.map((field) => value[field]);
      return JSON.stringify(candidate) === JSON.stringify(key);
    };
    return {
      get: (key: IDBValidKey) =>
        this.tx().request(() =>
          [...this.records.values()].find((record) => matches(record, key))
        ),
      getAll: (key: IDBValidKey) =>
        this.tx().request(() =>
          [...this.records.values()]
            .filter((record) => matches(record, key))
            .map((record) => structuredClone(record))
        )
    };
  }

  private key(value: IDBValidKey) {
    return JSON.stringify(value);
  }

  private keyFromValue(value: Record<string, unknown>) {
    const key = Array.isArray(this.keyPath)
      ? this.keyPath.map((part) => value[part])
      : value[this.keyPath];
    return this.key(key as IDBValidKey);
  }

  private tx() {
    if (!this.transaction)
      throw new Error('Fake store is not attached to a transaction.');
    return this.transaction;
  }
}

function makeDatabase(): IDBDatabase {
  const stores = new Map<string, FakeStore>([
    ['metadata', new FakeStore('key')],
    ['learnerProfiles', new FakeStore('id')],
    ['lessonProgress', new FakeStore('id')],
    ['lessonCompletionEvents', new FakeStore('id')],
    ['assessmentAttempts', new FakeStore('id')],
    [
      'skillMastery',
      new FakeStore(['learnerId', 'curriculumReleaseId', 'skillId'])
    ],
    ['practiceSessions', new FakeStore('id')],
    ['practiceEvidence', new FakeStore('id')],
    ['adaptiveRecommendationFeedback', new FakeStore('id')],
    ['songProjects', new FakeStore('id')]
  ]);

  return {
    transaction: () => new FakeTransaction(stores)
  } as unknown as IDBDatabase;
}

describe('local learner profile persistence', () => {
  it('creates a completely fresh profile with no assumed progress or preferences', () => {
    const profile = createEmptyLocalLearnerProfile(
      '0f3b1e7a-7e0f-47aa-b13f-2c7a04d82b99',
      100
    );

    expect(profile.id).toBe('0f3b1e7a-7e0f-47aa-b13f-2c7a04d82b99');
    expect(profile.createdAt).toBe(100);
    expect(profile.updatedAt).toBe(100);
    expect(profile.lastActiveAt).toBeNull();
    expect(profile.preferences).toEqual({
      schemaVersion: 1,
      instrument: null,
      handedness: null,
      tuning: null,
      startingPoint: null,
      goals: [],
      practiceMinutes: null,
      availableDays: [],
      practiceRoutines: [],
      lessonPresentation: null
    });
  });

  it('creates one active profile and reuses it on later visits', async () => {
    const database = makeDatabase();
    const first = await ensureActiveLearnerProfile(database);
    const second = await ensureActiveLearnerProfile(database);

    expect(second.id).toBe(first.id);
    expect(second.preferences).toEqual(first.preferences);
  });

  it('guards lesson completion and completion events with the checkpoint revision', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const record: LessonProgressRecord = {
      id: 'progress-1',
      learnerId: profile.id,
      curriculumReleaseId: 'curriculum-v1',
      lessonId: 'y1-w01-lesson',
      status: 'in_progress',
      lastBlockId: null,
      completedBlockIds: [],
      checkpointOutcome: null,
      checkpointNote: null,
      revision: 0,
      startedAt: 100,
      completedAt: null,
      updatedAt: 100
    };
    await repositories.progress.create(record);

    await expect(
      repositories.progress.updateInProgress(
        {
          ...record,
          lastBlockId: 'guided-demo',
          completedBlockIds: ['guided-demo'],
          checkpointOutcome: 'needs_practice',
          revision: 1,
          updatedAt: 200
        },
        0
      )
    ).resolves.toBe(true);

    const event: LessonCompletionEventRecord = {
      id: 'event-1',
      progressId: record.id,
      learnerId: profile.id,
      curriculumReleaseId: 'curriculum-v1',
      lessonId: record.lessonId,
      completionSource: 'checkpoint',
      completedAt: 300
    };
    await expect(
      repositories.progress.completeWithEvent(
        {
          ...record,
          revision: 2,
          status: 'completed',
          completedAt: 300,
          updatedAt: 300
        },
        event,
        1
      )
    ).resolves.toBeNull();

    await expect(
      repositories.progress.find(profile.id, 'curriculum-v1', 'y1-w01-lesson')
    ).resolves.toMatchObject({
      status: 'in_progress',
      checkpointOutcome: 'needs_practice',
      revision: 1
    });

    await expect(
      repositories.progress.updateInProgress(
        {
          ...record,
          lastBlockId: 'guided-demo',
          completedBlockIds: ['guided-demo'],
          checkpointOutcome: 'achieved',
          revision: 2,
          updatedAt: 400
        },
        1
      )
    ).resolves.toBe(true);

    const current = await repositories.progress.find(
      profile.id,
      'curriculum-v1',
      'y1-w01-lesson'
    );
    expect(current?.checkpointOutcome).toBe('achieved');
    const completed = await repositories.progress.completeWithEvent(
      {
        ...current!,
        status: 'completed',
        completedAt: 500,
        updatedAt: 500,
        revision: 3
      },
      { ...event, completedAt: 500 },
      2
    );
    expect(completed?.status).toBe('completed');

    await expect(
      repositories.progress.updateInProgress(
        { ...record, revision: 4, updatedAt: 600 },
        2
      )
    ).resolves.toBe(false);
  });

  it('stores song projects for their owner and protects stale or foreign edits', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const project: SongProjectRecord = {
      id: '123e4567-e89b-42d3-a456-426614174000',
      learnerId: profile.id,
      title: 'My arrangement',
      artist: null,
      sourceType: 'original',
      sourceUrl: null,
      notes: 'Keep the pulse relaxed.',
      sections: [
        {
          id: '223e4567-e89b-42d3-a456-426614174000',
          title: 'Verse',
          order: 0,
          notes: 'Bass note first.',
          bookmark: null,
          practiceTarget: 'Four clean changes.'
        }
      ],
      createdAt: 100,
      updatedAt: 100
    };

    await repositories.songProjects.create(project);
    await expect(
      repositories.songProjects.listByLearner(profile.id)
    ).resolves.toMatchObject([{ id: project.id, title: 'My arrangement' }]);
    await expect(
      repositories.songProjects.findById(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        project.id
      )
    ).resolves.toBeNull();

    const updated = {
      ...project,
      notes: 'Keep the pulse even.',
      updatedAt: 200
    };
    await expect(repositories.songProjects.update(updated, 100)).resolves.toBe(
      true
    );
    await expect(repositories.songProjects.update(project, 100)).resolves.toBe(
      false
    );
    await expect(
      repositories.songProjects.delete(
        'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        project.id
      )
    ).resolves.toBe(false);
    await expect(
      repositories.songProjects.delete(profile.id, project.id)
    ).resolves.toBe(true);
    await expect(
      repositories.songProjects.listByLearner(profile.id)
    ).resolves.toEqual([]);
  });

  it('prevents a second active practice session for the same learner', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repository = createIndexedDbRepositories(database).practice;
    const session: PracticeSessionRecord = {
      id: 'session-1',
      learnerId: profile.id,
      primaryCurriculumReleaseId: null,
      primaryLessonId: null,
      status: 'in_progress' as const,
      activeStartedAt: 100,
      plannedMinutes: 20,
      actualDurationSeconds: 0,
      focus: null,
      difficulty: null,
      reflection: null,
      startedAt: 100,
      endedAt: null,
      createdAt: 100,
      updatedAt: 100
    };
    await repository.create({
      ...session,
      id: 'session-history',
      status: 'completed',
      endedAt: 200
    });
    await repository.create(session);
    await expect(
      repository.create({ ...session, id: 'session-2' })
    ).rejects.toThrow(/existing practice session/i);

    const pausedDatabase = makeDatabase();
    const pausedProfile = await ensureActiveLearnerProfile(pausedDatabase);
    const pausedRepository =
      createIndexedDbRepositories(pausedDatabase).practice;
    await pausedRepository.create({
      ...session,
      id: 'session-paused',
      learnerId: pausedProfile.id,
      status: 'paused',
      activeStartedAt: null
    });
    await expect(
      pausedRepository.create({
        ...session,
        id: 'session-after-paused',
        learnerId: pausedProfile.id
      })
    ).rejects.toThrow(/existing practice session/i);
  });

  it('stores adaptive recommendation feedback as append-only learner-owned records', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repository =
      createIndexedDbRepositories(database).adaptiveRecommendationFeedback;
    const record: AdaptiveRecommendationFeedbackRecord = {
      id: '6d1b2a4c-6e8f-4a01-9b2c-3d4e5f6a7b8c',
      learnerId: profile.id,
      curriculumReleaseId: 'curriculum-v1.0.6',
      recommendationId: 'skill:rhythm.pulse',
      targetType: 'skill',
      targetId: 'rhythm.pulse',
      reasonCodes: ['assessment_needs_practice'],
      action: 'correct',
      correction: 'too_difficult',
      createdAt: 200
    };

    expect(LOCAL_DATABASE_VERSION).toBe(7);
    await repository.append(record);
    await expect(
      repository.listByLearnerRelease(profile.id, 'curriculum-v1.0.6')
    ).resolves.toEqual([record]);
    await expect(repository.append(record)).rejects.toThrow(/duplicate/i);
    await expect(
      repository.append({
        ...record,
        id: '7d1b2a4c-6e8f-4a01-9b2c-3d4e5f6a7b8c',
        learnerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      })
    ).rejects.toThrow(/saved learner profile/i);
    expect(
      await createIndexedDbRepositories(database).mastery.find(
        profile.id,
        'curriculum-v1.0.6',
        'rhythm.pulse'
      )
    ).toBeNull();
  });

  it('stores exercise observations as append-only, learner-owned session evidence', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const session: PracticeSessionRecord = {
      id: '5d1b2a4c-6e8f-4a01-9b2c-3d4e5f6a7b8c',
      learnerId: profile.id,
      primaryCurriculumReleaseId: 'curriculum-v1.0.6',
      primaryLessonId: 'y1-w01-lesson',
      primaryExerciseId: 'y1-w01-lesson-focus',
      practiceTaxonomyVersion: '0.1.0',
      status: 'in_progress',
      activeStartedAt: 100,
      plannedMinutes: 20,
      actualDurationSeconds: 0,
      focus: 'Alternate picking',
      difficulty: null,
      reflection: null,
      startedAt: 100,
      endedAt: null,
      createdAt: 100,
      updatedAt: 100
    };
    await repositories.practice.create(session);
    const observation: PracticeEvidenceRecord = {
      id: '6d1b2a4c-6e8f-4a01-9b2c-3d4e5f6a7b8c',
      learnerId: profile.id,
      sessionId: session.id,
      exerciseId: 'alternate-picking-eighth-notes',
      repetitions: 12,
      cleanRepetitions: 9,
      tempoBpm: 72,
      difficulty: 3,
      recordedAt: 200,
      curriculumReleaseId: 'curriculum-v1.0.6',
      lessonId: 'y1-w01-lesson',
      authoredExerciseId: 'y1-w01-lesson-focus',
      practiceTaxonomyVersion: '0.1.0'
    };

    await repositories.practiceEvidence.append(observation);
    await expect(
      repositories.practiceEvidence.listBySession(profile.id, session.id)
    ).resolves.toEqual([observation]);
    await expect(
      repositories.practiceEvidence.append(observation)
    ).rejects.toThrow(/duplicate/i);
    await expect(
      repositories.practiceEvidence.append({
        ...observation,
        id: '7d1b2a4c-6e8f-4a01-9b2c-3d4e5f6a7b8c',
        learnerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
      })
    ).rejects.toThrow(/owned by this learner/i);
    await expect(
      repositories.practiceEvidence.append({
        ...observation,
        id: '8d1b2a4c-6e8f-4a01-9b2c-3d4e5f6a7b8c',
        authoredExerciseId: 'another-exercise'
      })
    ).rejects.toThrow(/must match its session/i);
    expect(
      await repositories.mastery.find(
        profile.id,
        'curriculum-v1',
        'rhythm-pulse'
      )
    ).toBeNull();
  });

  it('persists validated preferences without creating lesson or mastery records', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const updated = await repositories.profiles.updatePreferences(
      profile.id,
      {
        ...profile.preferences,
        instrument: 'electric',
        handedness: 'left',
        tuning: 'D-A-D-G-A-D',
        startingPoint: 'some-experience',
        goals: ['rock-blues', 'singer-songwriter'],
        practiceMinutes: 40
      },
      200
    );

    expect(updated?.id).toBe(profile.id);
    expect(updated?.preferences.instrument).toBe('electric');
    expect(updated?.preferences.handedness).toBe('left');
    expect(updated?.preferences.tuning).toBe('D-A-D-G-A-D');
    expect(updated?.preferences.startingPoint).toBe('some-experience');
    expect(updated?.preferences.goals).toEqual([
      'rock-blues',
      'singer-songwriter'
    ]);
    expect(updated?.preferences.practiceMinutes).toBe(40);
    expect(updated?.updatedAt).toBe(200);
    expect(
      await repositories.mastery.find(
        profile.id,
        'curriculum-v1',
        'rhythm-pulse'
      )
    ).toBeNull();
  });
});
