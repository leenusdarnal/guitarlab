import { describe, expect, it } from 'vitest';
import type { LessonProgressRecord } from '../repositories/contracts';
import {
  createEmptyLocalLearnerProfile,
  createIndexedDbRepositories,
  ensureActiveLearnerProfile
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
        request.error = error instanceof Error ? error : new Error('Request failed.');
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

  index(name: string) {
    const fields =
      name === 'byLearnerReleaseLesson'
        ? ['learnerId', 'curriculumReleaseId', 'lessonId']
        : ['learnerId', 'curriculumReleaseId', 'skillId'];
    return {
      get: (key: IDBValidKey) =>
        this.tx().request(() =>
          [...this.records.values()].find((record) => {
            const value = record as Record<string, unknown>;
            const candidate = fields.map((field) => value[field]);
            return JSON.stringify(candidate) === JSON.stringify(key);
          })
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
    if (!this.transaction) throw new Error('Fake store is not attached to a transaction.');
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
    ['skillMastery', new FakeStore(['learnerId', 'curriculumReleaseId', 'skillId'])],
    ['practiceSessions', new FakeStore('id')]
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

  it('persists validated preferences without creating lesson or mastery records', async () => {
    const database = makeDatabase();
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const updated = await repositories.profiles.updatePreferences(
      profile.id,
      {
        ...profile.preferences,
        instrument: 'acoustic',
        startingPoint: 'fresh-beginner',
        goals: ['all-round-musician'],
        practiceMinutes: 20
      },
      200
    );

    expect(updated?.preferences.instrument).toBe('acoustic');
    expect(updated?.preferences.practiceMinutes).toBe(20);
    expect(updated?.updatedAt).toBe(200);
    expect(await repositories.mastery.find(
      profile.id,
      'curriculum-v1',
      'rhythm-pulse'
    )).toBeNull();
  });
});
