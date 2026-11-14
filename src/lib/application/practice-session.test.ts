import { beforeEach, describe, expect, it } from 'vitest';
import {
  finishPracticeSession,
  pausePracticeSession,
  recordPracticeEvidence,
  resumePracticeSession,
  startPracticeSession
} from './services';
import type {
  ApplicationRuntime,
  CurriculumRepository,
  PracticeEvidenceRepository,
  PracticeSessionRecord,
  PracticeSessionRepository
} from '../repositories/contracts';

const learnerId = '2d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a12';
const sessionId = '3d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a13';
const evidenceId = '4d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a14';

let now: number;
let sequence: number;
let sessions: Map<string, PracticeSessionRecord>;
let evidenceRows: Array<Record<string, unknown>>;
let runtime: ApplicationRuntime;
let practice: PracticeSessionRepository;
let curriculum: CurriculumRepository;
let evidence: PracticeEvidenceRepository;

const baseSession = (): PracticeSessionRecord => ({
  id: sessionId,
  learnerId,
  primaryCurriculumReleaseId: null,
  primaryLessonId: null,
  status: 'in_progress',
  activeStartedAt: 1_800_000_000_000,
  plannedMinutes: 20,
  actualDurationSeconds: 0,
  focus: 'Alternate picking',
  difficulty: null,
  reflection: null,
  nextTarget: null,
  startedAt: 1_800_000_000_000,
  endedAt: null,
  createdAt: 1_800_000_000_000,
  updatedAt: 1_800_000_000_000
});

beforeEach(() => {
  now = 1_800_000_010_000;
  sequence = 0;
  sessions = new Map([[sessionId, baseSession()]]);
  evidenceRows = [];
  runtime = {
    now: () => now,
    newId: () => {
      sequence += 1;
      return sequence === 1
        ? evidenceId
        : `5d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a1${sequence}`;
    }
  };
  practice = {
    create: async (session) => {
      sessions.set(session.id, session);
    },
    findById: async (id) => sessions.get(id) ?? null,
    updateIfStatus: async (session, expectedStatus) => {
      const current = sessions.get(session.id);
      if (!current || current.status !== expectedStatus) return false;
      sessions.set(session.id, session);
      return true;
    }
  };
  curriculum = {
    findRelease: async () => null,
    listLessons: async () => [],
    findLesson: async (releaseId, lessonId) =>
      releaseId === 'curriculum-v1' && lessonId === 'lesson-1'
        ? {
            releaseId,
            lessonId,
            curriculumId: 'guitar',
            curriculumWeekId: 'week-1',
            week: 1,
            route: '/learn/lesson-1',
            title: 'Alternate picking',
            focus: 'Picking',
            estimatedMinutes: 20
          }
        : null
  };
  evidence = {
    append: async (record) => {
      evidenceRows.push(record);
    },
    listBySession: async () => evidenceRows as never
  };
});

describe('practice session lifecycle', () => {
  it('starts a session with validated optional lesson context and normalized focus', async () => {
    const created = await startPracticeSession(
      {
        learnerId,
        plannedMinutes: 20,
        primaryCurriculumReleaseId: 'curriculum-v1',
        primaryLessonId: 'lesson-1',
        primaryExerciseId: 'lesson-1-focus',
        practiceTaxonomyVersion: '0.1.0',
        focus: '  Alternate picking  '
      },
      { curriculum, practice, runtime }
    );

    expect(created).toMatchObject({
      learnerId,
      status: 'in_progress',
      activeStartedAt: now,
      startedAt: now,
      plannedMinutes: 20,
      primaryCurriculumReleaseId: 'curriculum-v1',
      primaryLessonId: 'lesson-1',
      primaryExerciseId: 'lesson-1-focus',
      practiceTaxonomyVersion: '0.1.0',
      focus: 'Alternate picking',
      actualDurationSeconds: 0
    });
    expect(sessions.get(created.id)).toEqual(created);
  });

  it('rejects mismatched lesson context, unknown lessons and invalid durations', async () => {
    await expect(
      startPracticeSession(
        {
          learnerId,
          plannedMinutes: 20,
          primaryCurriculumReleaseId: 'curriculum-v1',
          primaryLessonId: null,
          focus: null
        },
        { curriculum, practice, runtime }
      )
    ).rejects.toThrow();

    await expect(
      startPracticeSession(
        {
          learnerId,
          plannedMinutes: 20,
          primaryCurriculumReleaseId: 'curriculum-v1',
          primaryLessonId: 'missing',
          focus: null
        },
        { curriculum, practice, runtime }
      )
    ).rejects.toThrow(/Practice lesson not found/);

    await expect(
      startPracticeSession(
        {
          learnerId,
          plannedMinutes: 20,
          primaryCurriculumReleaseId: 'curriculum-v1',
          primaryLessonId: 'lesson-1',
          primaryExerciseId: 'lesson-1-focus',
          focus: null
        },
        { curriculum, practice, runtime }
      )
    ).rejects.toThrow(/taxonomy version/);

    await expect(
      startPracticeSession(
        {
          learnerId,
          plannedMinutes: 181,
          primaryCurriculumReleaseId: null,
          primaryLessonId: null,
          focus: null
        },
        { curriculum, practice, runtime }
      )
    ).rejects.toThrow();
    expect(sessions.size).toBe(1);
  });

  it('pauses and resumes while counting only active segments', async () => {
    const paused = await pausePracticeSession(
      { learnerId, sessionId },
      { practice, runtime }
    );
    expect(paused).toMatchObject({
      status: 'paused',
      activeStartedAt: null,
      actualDurationSeconds: 10,
      updatedAt: now
    });

    now += 60_000;
    const resumed = await resumePracticeSession(
      { learnerId, sessionId },
      { practice, runtime }
    );
    expect(resumed).toMatchObject({
      status: 'in_progress',
      activeStartedAt: now,
      actualDurationSeconds: 10
    });

    now += 5_500;
    const pausedAgain = await pausePracticeSession(
      { learnerId, sessionId },
      { practice, runtime }
    );
    expect(pausedAgain.actualDurationSeconds).toBe(15);
  });

  it('rejects pause/resume for missing, foreign-owned, or wrong-state sessions', async () => {
    await expect(
      pausePracticeSession(
        { learnerId, sessionId: evidenceId },
        { practice, runtime }
      )
    ).rejects.toThrow(/not found/);
    await expect(
      pausePracticeSession(
        { learnerId: evidenceId, sessionId },
        { practice, runtime }
      )
    ).rejects.toThrow(/not found/);

    await practice.updateIfStatus(
      { ...baseSession(), status: 'paused', activeStartedAt: null },
      'in_progress'
    );
    await expect(
      pausePracticeSession({ learnerId, sessionId }, { practice, runtime })
    ).rejects.toThrow(/Only a running/);
    await expect(
      resumePracticeSession(
        { learnerId, sessionId: evidenceId },
        { practice, runtime }
      )
    ).rejects.toThrow(/not found/);
    await practice.updateIfStatus(baseSession(), 'paused');
    await expect(
      resumePracticeSession({ learnerId, sessionId }, { practice, runtime })
    ).rejects.toThrow(/Only a paused/);
  });

  it('rejects clock regressions and compare-and-set conflicts', async () => {
    now = baseSession().startedAt - 1;
    await expect(
      pausePracticeSession({ learnerId, sessionId }, { practice, runtime })
    ).rejects.toThrow(/earlier than the active segment/);

    now = baseSession().startedAt + 10_000;
    const racingRepository: PracticeSessionRepository = {
      ...practice,
      updateIfStatus: async () => false
    };
    await expect(
      pausePracticeSession(
        { learnerId, sessionId },
        { practice: racingRepository, runtime }
      )
    ).rejects.toThrow(/already updated/);
  });

  it('records learner-entered evidence only for the owning non-abandoned session', async () => {
    const record = await recordPracticeEvidence(
      {
        learnerId,
        submission: {
          sessionId,
          exerciseId: 'alternate-picking-eighth-notes',
          repetitions: 20,
          cleanRepetitions: 16,
          tempoBpm: 80,
          difficulty: 3
        }
      },
      { practice, evidence, runtime }
    );
    expect(record).toMatchObject({
      id: evidenceId,
      learnerId,
      sessionId,
      repetitions: 20,
      cleanRepetitions: 16,
      recordedAt: now
    });
    expect(evidenceRows).toHaveLength(1);

    await expect(
      recordPracticeEvidence(
        {
          learnerId: evidenceId,
          submission: {
            sessionId,
            exerciseId: 'alternate-picking-eighth-notes',
            repetitions: 1,
            cleanRepetitions: 1,
            tempoBpm: null,
            difficulty: null
          }
        },
        { practice, evidence, runtime }
      )
    ).rejects.toThrow(/not found/);

    await practice.updateIfStatus(
      { ...baseSession(), status: 'abandoned', activeStartedAt: null },
      'in_progress'
    );
    await expect(
      recordPracticeEvidence(
        {
          learnerId,
          submission: {
            sessionId,
            exerciseId: 'alternate-picking-eighth-notes',
            repetitions: 1,
            cleanRepetitions: 1,
            tempoBpm: null,
            difficulty: null
          }
        },
        { practice, evidence, runtime }
      )
    ).rejects.toThrow(/abandoned/);
    expect(evidenceRows).toHaveLength(1);
  });

  it('copies the owning session authored identity to new observations', async () => {
    sessions.set(sessionId, {
      ...baseSession(),
      primaryCurriculumReleaseId: 'curriculum-v1.0.6',
      primaryLessonId: 'y1-w01-lesson',
      primaryExerciseId: 'y1-w01-lesson-focus',
      practiceTaxonomyVersion: '0.1.0'
    });
    const record = await recordPracticeEvidence(
      {
        learnerId,
        submission: {
          sessionId,
          exerciseId: 'Meet your guitar',
          repetitions: 4,
          cleanRepetitions: 4,
          tempoBpm: null,
          difficulty: null
        }
      },
      { practice, evidence, runtime }
    );
    expect(record).toMatchObject({
      curriculumReleaseId: 'curriculum-v1.0.6',
      lessonId: 'y1-w01-lesson',
      authoredExerciseId: 'y1-w01-lesson-focus',
      practiceTaxonomyVersion: '0.1.0'
    });
  });

  it('finishes running and paused sessions, trims notes and stores learner duration', async () => {
    const completed = await finishPracticeSession(
      {
        learnerId,
        sessionId,
        actualDurationSeconds: 42,
        reflection: '  Wrist stayed relaxed.  ',
        nextTarget: '  Repeat at 80 BPM.  '
      },
      { practice, runtime }
    );
    expect(completed).toMatchObject({
      status: 'completed',
      activeStartedAt: null,
      actualDurationSeconds: 42,
      reflection: 'Wrist stayed relaxed.',
      nextTarget: 'Repeat at 80 BPM.',
      endedAt: now,
      updatedAt: now
    });

    await expect(
      finishPracticeSession(
        { learnerId, sessionId, actualDurationSeconds: 42 },
        { practice, runtime }
      )
    ).rejects.toThrow(/Only an active or paused/);

    sessions.set(sessionId, {
      ...baseSession(),
      status: 'paused',
      activeStartedAt: null,
      actualDurationSeconds: 10
    });
    now += 5_000;
    const finishedWhilePaused = await finishPracticeSession(
      {
        learnerId,
        sessionId,
        actualDurationSeconds: 10,
        reflection: '   ',
        nextTarget: null
      },
      { practice, runtime }
    );
    expect(finishedWhilePaused).toMatchObject({
      status: 'completed',
      actualDurationSeconds: 10,
      reflection: null,
      nextTarget: null
    });
  });

  it('rejects invalid finish durations, foreign ownership and stale updates', async () => {
    for (const actualDurationSeconds of [0, -1, 43_201, 1.5]) {
      await expect(
        finishPracticeSession(
          { learnerId, sessionId, actualDurationSeconds },
          { practice, runtime }
        )
      ).rejects.toThrow();
    }
    await expect(
      finishPracticeSession(
        { learnerId: evidenceId, sessionId, actualDurationSeconds: 10 },
        { practice, runtime }
      )
    ).rejects.toThrow(/not found/);

    const racingRepository: PracticeSessionRepository = {
      ...practice,
      updateIfStatus: async () => false
    };
    await expect(
      finishPracticeSession(
        { learnerId, sessionId, actualDurationSeconds: 10 },
        { practice: racingRepository, runtime }
      )
    ).rejects.toThrow(/already updated/);
  });
});
