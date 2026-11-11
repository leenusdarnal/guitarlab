import { beforeEach, describe, expect, it } from 'vitest';
import type {
  ApplicationRuntime,
  AssessmentAttemptRecord,
  AssessmentAttemptRepository,
  CurriculumLessonRecord,
  CurriculumReleaseRecord,
  CurriculumRepository,
  LearnerProfileRecord,
  LearnerProfileRepository,
  LessonCompletionEventRecord,
  LessonProgressRecord,
  LessonProgressRepository,
  PracticeSessionRecord,
  PracticeSessionRepository,
  SkillMasteryRecord,
  SkillMasteryRepository,
  SkillRecord,
  SkillRepository
} from '../repositories/contracts';
import {
  completeLesson,
  createEmptyLearnerProfile,
  finishPracticeSession,
  getCurriculumLesson,
  listCurriculumLessons,
  recordAssessmentAttempt,
  startLessonProgress,
  updateLessonProgress,
  startPracticeSession,
  updateLearnerPreferences,
  updateSkillMasteryFromEvidence
} from './services';
import {
  ConflictError,
  InvalidStateError,
  NotFoundError,
  ValidationError,
  toSafeApplicationError
} from './errors';
import { createEmptyProfilePreferences } from '../domain/profile/preferences';

const learnerId = '6d1a32df-2cbd-4930-b594-32ed2f8a44e2';
const releaseId = 'curriculum-v1';
const lessonId = 'y1-w01-lesson';
const skillId = 'instrument.tuning';

const release: CurriculumReleaseRecord = {
  id: releaseId,
  version: '1.0.0',
  schemaVersion: 1,
  contentHash: 'a'.repeat(64),
  publishedAt: 1_794_355_200_000,
  status: 'published'
};

const lesson: CurriculumLessonRecord = {
  releaseId,
  lessonId,
  curriculumId: 'year-1',
  curriculumWeekId: 'y1-w01',
  week: 1,
  route: '/curriculum/year-1/week-1',
  title: 'Meet your guitar',
  focus: 'Instrument orientation',
  estimatedMinutes: 20
};

const skill: SkillRecord = {
  id: skillId,
  category: 'instrument',
  displayName: 'Instrument orientation'
};

function createHarness() {
  let sequence = 1;
  let now = 1_794_355_200_000;
  const runtime: ApplicationRuntime = {
    newId: () =>
      '00000000-0000-4000-8000-' + String(sequence++).padStart(12, '0'),
    now: () => now
  };
  const setNow = (value: number) => {
    now = value;
  };

  const profiles = new Map<string, LearnerProfileRecord>();
  const progressRows = new Map<string, LessonProgressRecord>();
  const completionEvents: LessonCompletionEventRecord[] = [];
  const attempts: AssessmentAttemptRecord[] = [];
  const masteryRows = new Map<string, SkillMasteryRecord>();
  const sessions = new Map<string, PracticeSessionRecord>();

  const profileRepository: LearnerProfileRepository = {
    async create(profile) {
      if (profiles.has(profile.id)) throw new Error('duplicate profile');
      profiles.set(profile.id, profile);
    },
    async findById(id) {
      return profiles.get(id) ?? null;
    },
    async updatePreferences(id, preferences, updatedAt) {
      const current = profiles.get(id);
      if (!current) return null;
      const next = { ...current, preferences, updatedAt };
      profiles.set(id, next);
      return next;
    }
  };

  const curriculumRepository: CurriculumRepository = {
    async findRelease(id) {
      return id === release.id ? release : null;
    },
    async listLessons(id) {
      return id === releaseId ? [lesson] : [];
    },
    async findLesson(release, lessonKey) {
      return release === releaseId && lessonKey === lessonId ? lesson : null;
    }
  };

  const skillRepository: SkillRepository = {
    async listForRelease(id) {
      return id === releaseId ? [skill] : [];
    },
    async findForRelease(releaseKey, skillKey) {
      return releaseKey === releaseId && skillKey === skillId ? skill : null;
    }
  };

  const progressRepository: LessonProgressRepository = {
    async find(owner, releaseKey, lessonKey) {
      return (
        [...progressRows.values()].find(
          (row) =>
            row.learnerId === owner &&
            row.curriculumReleaseId === releaseKey &&
            row.lessonId === lessonKey
        ) ?? null
      );
    },
    async create(progress) {
      progressRows.set(progress.id, progress);
    },
    async updateInProgress(progress, expectedRevision) {
      const current = progressRows.get(progress.id);
      if (
        !current ||
        current.status !== 'in_progress' ||
        (current.revision ?? 0) !== expectedRevision
      ) {
        return false;
      }
      progressRows.set(progress.id, progress);
      return true;
    },
    async completeWithEvent(progress, event) {
      progressRows.set(progress.id, progress);
      completionEvents.push(event);
      return progress;
    }
  };

  const assessmentRepository: AssessmentAttemptRepository = {
    async append(attempt) {
      attempts.push(attempt);
    },
    async listBySkill(owner, releaseKey, skillKey) {
      return attempts.filter(
        (attempt) =>
          attempt.learnerId === owner &&
          attempt.curriculumReleaseId === releaseKey &&
          attempt.skillId === skillKey
      );
    },
    async findById(id) {
      return attempts.find((attempt) => attempt.id === id) ?? null;
    }
  };

  const masteryRepository: SkillMasteryRepository = {
    async find(owner, releaseKey, skillKey) {
      return masteryRows.get([owner, releaseKey, skillKey].join(':')) ?? null;
    },
    async save(snapshot) {
      masteryRows.set(
        [
          snapshot.learnerId,
          snapshot.curriculumReleaseId,
          snapshot.skillId
        ].join(':'),
        snapshot
      );
    }
  };

  const practiceRepository: PracticeSessionRepository = {
    async create(session) {
      sessions.set(session.id, session);
    },
    async findById(id) {
      return sessions.get(id) ?? null;
    },
    async updateIfInProgress(session) {
      const current = sessions.get(session.id);
      if (!current || current.status !== 'in_progress') return false;
      sessions.set(session.id, session);
      return true;
    }
  };

  return {
    runtime,
    setNow,
    profiles,
    progressRows,
    completionEvents,
    attempts,
    masteryRows,
    sessions,
    profileRepository,
    curriculumRepository,
    skillRepository,
    progressRepository,
    assessmentRepository,
    masteryRepository,
    practiceRepository
  };
}

describe('M2.2 application service boundaries', () => {
  let harness: ReturnType<typeof createHarness>;

  beforeEach(() => {
    harness = createHarness();
  });

  it('creates a genuinely empty learner profile', async () => {
    const profile = await createEmptyLearnerProfile(
      {},
      {
        profiles: harness.profileRepository,
        runtime: harness.runtime
      }
    );

    expect(profile.preferences).toEqual(createEmptyProfilePreferences());
    expect(profile.lastActiveAt).toBeNull();
    expect(profile.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(harness.profiles.get(profile.id)).toEqual(profile);
  });

  it('validates preferences before saving them', async () => {
    const profile = await createEmptyLearnerProfile(
      {},
      {
        profiles: harness.profileRepository,
        runtime: harness.runtime
      }
    );
    const updated = await updateLearnerPreferences(
      {
        learnerId: profile.id,
        preferences: {
          ...profile.preferences,
          instrument: 'acoustic',
          handedness: 'right',
          tuning: 'E-A-D-G-B-E',
          startingPoint: 'fresh-beginner',
          goals: ['all-round-musician'],
          practiceMinutes: 20,
          lessonPresentation: 'balanced'
        }
      },
      { profiles: harness.profileRepository, runtime: harness.runtime }
    );

    expect(updated.preferences.practiceMinutes).toBe(20);
    await expect(
      updateLearnerPreferences(
        {
          learnerId: profile.id,
          preferences: { ...profile.preferences, practiceMinutes: 0 }
        },
        { profiles: harness.profileRepository, runtime: harness.runtime }
      )
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it('keeps public curriculum reads version-scoped and separate from profiles', async () => {
    await expect(
      listCurriculumLessons({ releaseId }, harness.curriculumRepository)
    ).resolves.toEqual([lesson]);
    await expect(
      getCurriculumLesson(
        { releaseId, lessonId: 'not-in-this-release' },
        harness.curriculumRepository
      )
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(harness.profiles.size).toBe(0);
  });

  it('persists lesson sections and checkpoint self-check without granting mastery', async () => {
    const started = await startLessonProgress(
      { learnerId, releaseId, lessonId },
      {
        curriculum: harness.curriculumRepository,
        progress: harness.progressRepository,
        runtime: harness.runtime
      }
    );
    const saved = await updateLessonProgress(
      {
        learnerId,
        releaseId,
        lessonId,
        expectedRevision: 0,
        lastBlockId: 'guided-demo',
        completedBlockIds: ['guided-demo'],
        checkpointOutcome: 'needs_practice',
        checkpointNote: 'Slow down and keep each note even.'
      },
      {
        progress: harness.progressRepository,
        runtime: harness.runtime
      }
    );
    expect(saved.id).toBe(started.id);
    expect(saved.completedBlockIds).toEqual(['guided-demo']);
    expect(saved.checkpointOutcome).toBe('needs_practice');
    expect(saved.checkpointNote).toBe('Slow down and keep each note even.');
    expect(saved.revision).toBe(1);
    await expect(
      updateLessonProgress(
        {
          learnerId,
          releaseId,
          lessonId,
          expectedRevision: 0,
          lastBlockId: 'guided-demo',
          completedBlockIds: ['guided-demo'],
          checkpointOutcome: 'achieved',
          checkpointNote: null
        },
        {
          progress: harness.progressRepository,
          runtime: harness.runtime
        }
      )
    ).rejects.toBeInstanceOf(ConflictError);
    expect(harness.masteryRows.size).toBe(0);

    const resumed = await startLessonProgress(
      { learnerId, releaseId, lessonId },
      {
        curriculum: harness.curriculumRepository,
        progress: harness.progressRepository,
        runtime: harness.runtime
      }
    );
    expect(resumed.completedBlockIds).toEqual(['guided-demo']);

    await completeLesson(
      {
        learnerId,
        releaseId,
        lessonId,
        completionSource: 'learner_confirmed',
        lastBlockId: 'guided-demo'
      },
      {
        progress: harness.progressRepository,
        runtime: harness.runtime
      }
    );
    await expect(
      updateLessonProgress(
        {
          learnerId,
          releaseId,
          lessonId,
          expectedRevision: 1,
          lastBlockId: 'guided-demo',
          completedBlockIds: ['guided-demo'],
          checkpointOutcome: 'achieved',
          checkpointNote: null
        },
        {
          progress: harness.progressRepository,
          runtime: harness.runtime
        }
      )
    ).rejects.toBeInstanceOf(ConflictError);
    expect(harness.masteryRows.size).toBe(0);
  });

  it('starts/resumes lesson progress and records completion without granting mastery', async () => {
    const started = await startLessonProgress(
      { learnerId, releaseId, lessonId },
      {
        curriculum: harness.curriculumRepository,
        progress: harness.progressRepository,
        runtime: harness.runtime
      }
    );
    const resumed = await startLessonProgress(
      { learnerId, releaseId, lessonId },
      {
        curriculum: harness.curriculumRepository,
        progress: harness.progressRepository,
        runtime: harness.runtime
      }
    );
    expect(resumed.id).toBe(started.id);

    const completed = await completeLesson(
      {
        learnerId,
        releaseId,
        lessonId,
        completionSource: 'learner_confirmed',
        lastBlockId: 'reflection'
      },
      { progress: harness.progressRepository, runtime: harness.runtime }
    );

    expect(completed.status).toBe('completed');
    expect(harness.completionEvents).toHaveLength(1);
    expect(harness.masteryRows.size).toBe(0);
    await expect(
      completeLesson(
        {
          learnerId,
          releaseId,
          lessonId,
          completionSource: 'learner_confirmed',
          lastBlockId: null
        },
        { progress: harness.progressRepository, runtime: harness.runtime }
      )
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('uses the service scope for assessment ownership and appends immutable evidence', async () => {
    const submission = {
      curriculumReleaseId: releaseId,
      skillId,
      lessonId,
      assessmentKind: 'checkpoint',
      evidenceType: 'observed_or_self_checked',
      outcome: 'passed',
      score: 90,
      evidenceSummary: 'Correctly named all six strings.',
      evidence: { correctItems: 6, totalItems: 6 }
    } as const;

    const attempt = await recordAssessmentAttempt(
      { learnerId, submission },
      {
        curriculum: harness.curriculumRepository,
        skills: harness.skillRepository,
        assessments: harness.assessmentRepository,
        runtime: harness.runtime
      }
    );

    expect(attempt.learnerId).toBe(learnerId);
    expect(attempt.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(harness.attempts).toHaveLength(1);
    await expect(
      recordAssessmentAttempt(
        {
          learnerId,
          submission: { ...submission, learnerId: 'someone-else' }
        },
        {
          curriculum: harness.curriculumRepository,
          skills: harness.skillRepository,
          assessments: harness.assessmentRepository,
          runtime: harness.runtime
        }
      )
    ).rejects.toBeInstanceOf(ValidationError);
    expect(harness.attempts).toHaveLength(1);
  });

  it('does not let stale or failed evidence establish stable mastery', async () => {
    const baseSubmission = {
      curriculumReleaseId: releaseId,
      skillId,
      lessonId,
      assessmentKind: 'checkpoint',
      evidenceType: 'observed_or_self_checked',
      score: 90,
      evidenceSummary: null,
      evidence: {}
    } as const;

    await recordAssessmentAttempt(
      {
        learnerId,
        submission: { ...baseSubmission, outcome: 'passed' }
      },
      {
        curriculum: harness.curriculumRepository,
        skills: harness.skillRepository,
        assessments: harness.assessmentRepository,
        runtime: harness.runtime
      }
    );
    harness.setNow(1_794_355_200_100);
    await recordAssessmentAttempt(
      {
        learnerId,
        submission: { ...baseSubmission, outcome: 'needs_practice' }
      },
      {
        curriculum: harness.curriculumRepository,
        skills: harness.skillRepository,
        assessments: harness.assessmentRepository,
        runtime: harness.runtime
      }
    );

    await expect(
      updateSkillMasteryFromEvidence(
        {
          learnerId,
          releaseId,
          skillId,
          state: 'stable',
          confidence: 80,
          nextReviewAt: null
        },
        {
          curriculum: harness.curriculumRepository,
          skills: harness.skillRepository,
          assessments: harness.assessmentRepository,
          mastery: harness.masteryRepository,
          runtime: harness.runtime
        }
      )
    ).rejects.toBeInstanceOf(InvalidStateError);

    harness.setNow(1_794_355_200_200);
    await recordAssessmentAttempt(
      {
        learnerId,
        submission: { ...baseSubmission, outcome: 'passed' }
      },
      {
        curriculum: harness.curriculumRepository,
        skills: harness.skillRepository,
        assessments: harness.assessmentRepository,
        runtime: harness.runtime
      }
    );

    const snapshot = await updateSkillMasteryFromEvidence(
      {
        learnerId,
        releaseId,
        skillId,
        state: 'stable',
        confidence: 80,
        nextReviewAt: null
      },
      {
        curriculum: harness.curriculumRepository,
        skills: harness.skillRepository,
        assessments: harness.assessmentRepository,
        mastery: harness.masteryRepository,
        runtime: harness.runtime
      }
    );

    expect(snapshot.state).toBe('stable');
    expect(snapshot.evidenceCount).toBe(3);
    expect(snapshot.lastAssessmentId).toBe(harness.attempts[2].id);
  });

  it('records actual practice duration but never creates mastery evidence', async () => {
    const session = await startPracticeSession(
      {
        learnerId,
        plannedMinutes: 20,
        primaryCurriculumReleaseId: releaseId,
        primaryLessonId: lessonId,
        focus: 'String naming and tuning'
      },
      {
        curriculum: harness.curriculumRepository,
        practice: harness.practiceRepository,
        runtime: harness.runtime
      }
    );

    await expect(
      finishPracticeSession(
        {
          learnerId,
          sessionId: session.id,
          actualDurationSeconds: 0
        },
        { practice: harness.practiceRepository, runtime: harness.runtime }
      )
    ).rejects.toBeInstanceOf(ValidationError);

    harness.setNow(session.startedAt + 20_000);
    const completed = await finishPracticeSession(
      {
        learnerId,
        sessionId: session.id,
        actualDurationSeconds: 1_200
      },
      { practice: harness.practiceRepository, runtime: harness.runtime }
    );

    expect(completed.status).toBe('completed');
    expect(completed.plannedMinutes).toBe(20);
    expect(completed.actualDurationSeconds).toBe(1_200);
    expect(harness.masteryRows.size).toBe(0);
    await expect(
      finishPracticeSession(
        {
          learnerId,
          sessionId: session.id,
          actualDurationSeconds: 1_200
        },
        { practice: harness.practiceRepository, runtime: harness.runtime }
      )
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('returns typed, user-safe errors without leaking unknown storage exceptions', () => {
    expect(
      toSafeApplicationError(new Error('SQLITE constraint failed'))
    ).toEqual({
      code: 'INTERNAL',
      message: 'Something went wrong. Please try again.'
    });
  });
});
