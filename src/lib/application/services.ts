import { z } from 'zod';
import {
  assessmentAttemptInputSchema,
  type AssessmentAttemptInput
} from '../domain/learning/assessment';
import {
  skillMasteryStateSchema,
  skillMasteryUpdateSchema
} from '../domain/learning/mastery';
import {
  createEmptyProfilePreferences,
  profilePreferencesSchema
} from '../domain/profile/preferences';
import {
  ConflictError,
  InvalidStateError,
  NotFoundError,
  parseInput
} from './errors';
import type {
  ApplicationRuntime,
  AssessmentAttemptRecord,
  AssessmentAttemptRepository,
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
  SkillRepository
} from '../repositories/contracts';

const uuidSchema = z.string().uuid();
const releaseIdSchema = z.string().min(1).max(100);
const lessonIdSchema = z.string().min(1).max(160);
const skillIdSchema = z.string().min(1).max(120);
const strictPreferencesSchema = profilePreferencesSchema.strict();

const emptyProfileInputSchema = z.object({}).strict();
const updatePreferencesInputSchema = z
  .object({
    learnerId: uuidSchema,
    preferences: strictPreferencesSchema
  })
  .strict();

export async function createEmptyLearnerProfile(
  input: unknown,
  dependencies: {
    profiles: LearnerProfileRepository;
    runtime: ApplicationRuntime;
  }
): Promise<LearnerProfileRecord> {
  parseInput(emptyProfileInputSchema, input);
  const now = dependencies.runtime.now();
  const profile: LearnerProfileRecord = {
    id: dependencies.runtime.newId(),
    preferencesSchemaVersion: 1,
    preferences: createEmptyProfilePreferences(),
    createdAt: now,
    updatedAt: now,
    lastActiveAt: null
  };

  if (await dependencies.profiles.findById(profile.id)) {
    throw new ConflictError('A profile with this identifier already exists.');
  }

  await dependencies.profiles.create(profile);
  return profile;
}

export async function updateLearnerPreferences(
  input: unknown,
  dependencies: {
    profiles: LearnerProfileRepository;
    runtime: ApplicationRuntime;
  }
): Promise<LearnerProfileRecord> {
  const value = parseInput(updatePreferencesInputSchema, input);
  if (!(await dependencies.profiles.findById(value.learnerId))) {
    throw new NotFoundError('Learner profile not found.');
  }

  const updated = await dependencies.profiles.updatePreferences(
    value.learnerId,
    value.preferences,
    dependencies.runtime.now()
  );

  if (!updated) {
    throw new NotFoundError('Learner profile not found.');
  }

  return updated;
}

const curriculumReleaseInputSchema = z
  .object({ releaseId: releaseIdSchema })
  .strict();

const curriculumLessonInputSchema = z
  .object({
    releaseId: releaseIdSchema,
    lessonId: lessonIdSchema
  })
  .strict();

/** Public content reads are deliberately separate from private profile reads. */
export async function listCurriculumLessons(
  input: unknown,
  curriculum: CurriculumRepository
) {
  const { releaseId } = parseInput(curriculumReleaseInputSchema, input);
  if (!(await curriculum.findRelease(releaseId))) {
    throw new NotFoundError('Curriculum release not found.');
  }

  return curriculum.listLessons(releaseId);
}

export async function getCurriculumLesson(
  input: unknown,
  curriculum: CurriculumRepository
) {
  const value = parseInput(curriculumLessonInputSchema, input);
  if (!(await curriculum.findRelease(value.releaseId))) {
    throw new NotFoundError('Curriculum release not found.');
  }

  const lesson = await curriculum.findLesson(value.releaseId, value.lessonId);
  if (!lesson) {
    throw new NotFoundError('Lesson not found in this curriculum release.');
  }

  return lesson;
}

export async function listCurriculumSkills(
  input: unknown,
  dependencies: {
    curriculum: CurriculumRepository;
    skills: SkillRepository;
  }
) {
  const { releaseId } = parseInput(curriculumReleaseInputSchema, input);
  if (!(await dependencies.curriculum.findRelease(releaseId))) {
    throw new NotFoundError('Curriculum release not found.');
  }

  return dependencies.skills.listForRelease(releaseId);
}

const lessonProgressStartSchema = z
  .object({
    learnerId: uuidSchema,
    releaseId: releaseIdSchema,
    lessonId: lessonIdSchema
  })
  .strict();

export async function startLessonProgress(
  input: unknown,
  dependencies: {
    curriculum: CurriculumRepository;
    progress: LessonProgressRepository;
    runtime: ApplicationRuntime;
  }
): Promise<LessonProgressRecord> {
  const value = parseInput(lessonProgressStartSchema, input);
  if (
    !(await dependencies.curriculum.findLesson(value.releaseId, value.lessonId))
  ) {
    throw new NotFoundError('Lesson not found in this curriculum release.');
  }

  const existing = await dependencies.progress.find(
    value.learnerId,
    value.releaseId,
    value.lessonId
  );
  if (existing) return existing;

  const now = dependencies.runtime.now();
  const progress: LessonProgressRecord = {
    id: dependencies.runtime.newId(),
    learnerId: value.learnerId,
    curriculumReleaseId: value.releaseId,
    lessonId: value.lessonId,
    status: 'in_progress',
    lastBlockId: null,
    completedBlockIds: [],
    checkpointOutcome: null,
    checkpointNote: null,
    startedAt: now,
    completedAt: null,
    updatedAt: now
  };

  await dependencies.progress.create(progress);
  return progress;
}

const updateLessonProgressInputSchema = z.object({
  learnerId: uuidSchema,
  releaseId: releaseIdSchema,
  lessonId: lessonIdSchema,
  lastBlockId: z.string().min(1).max(160).nullable(),
  completedBlockIds: z.array(z.string().min(1).max(160)).max(200),
  checkpointOutcome: z.enum(['achieved', 'needs_practice']).nullable(),
  checkpointNote: z.string().max(500).nullable()
}).strict().superRefine((value, context) => {
  if (new Set(value.completedBlockIds).size !== value.completedBlockIds.length) {
    context.addIssue({ code: 'custom', path: ['completedBlockIds'], message: 'A lesson block can only be recorded once.' });
  }
  if (value.lastBlockId && !value.completedBlockIds.includes(value.lastBlockId)) {
    context.addIssue({ code: 'custom', path: ['lastBlockId'], message: 'The last visited block must be included in completed lesson blocks.' });
  }
});

/** Save learner-controlled section/checkpoint state, never skill mastery evidence. */
export async function updateLessonProgress(
  input: unknown,
  dependencies: { progress: LessonProgressRepository; runtime: ApplicationRuntime }
): Promise<LessonProgressRecord> {
  const value = parseInput(updateLessonProgressInputSchema, input);
  const current = await dependencies.progress.find(value.learnerId, value.releaseId, value.lessonId);
  if (!current) throw new NotFoundError('Lesson progress not found.');
  if (current.status !== 'in_progress') throw new ConflictError('A completed lesson can no longer be changed.');

  const updated: LessonProgressRecord = {
    ...current,
    lastBlockId: value.lastBlockId,
    completedBlockIds: [...value.completedBlockIds],
    checkpointOutcome: value.checkpointOutcome,
    checkpointNote: value.checkpointNote,
    updatedAt: dependencies.runtime.now()
  };
  const saved = await dependencies.progress.updateInProgress(updated);
  if (!saved) {
    const latest = await dependencies.progress.find(value.learnerId, value.releaseId, value.lessonId);
    if (latest?.status === 'completed') throw new ConflictError('A completed lesson can no longer be changed.');
    throw new ConflictError('Lesson progress changed in another tab. Reload and try again.');
  }
  return updated;
}

const completeLessonInputSchema = z
  .object({
    learnerId: uuidSchema,
    releaseId: releaseIdSchema,
    lessonId: lessonIdSchema,
    completionSource: z.enum([
      'checkpoint',
      'learner_confirmed',
      'resume_recovery'
    ]),
    lastBlockId: z.string().max(160).nullable()
  })
  .strict();

export async function completeLesson(
  input: unknown,
  dependencies: {
    progress: LessonProgressRepository;
    runtime: ApplicationRuntime;
  }
): Promise<LessonProgressRecord> {
  const value = parseInput(completeLessonInputSchema, input);
  const current = await dependencies.progress.find(
    value.learnerId,
    value.releaseId,
    value.lessonId
  );
  if (!current) throw new NotFoundError('Lesson progress not found.');
  if (current.status === 'completed') {
    throw new ConflictError('This lesson is already marked as completed.');
  }

  const now = dependencies.runtime.now();
  const completed: LessonProgressRecord = {
    ...current,
    status: 'completed',
    lastBlockId: value.lastBlockId,
    completedAt: now,
    updatedAt: now
  };
  const event: LessonCompletionEventRecord = {
    id: dependencies.runtime.newId(),
    progressId: current.id,
    learnerId: current.learnerId,
    curriculumReleaseId: current.curriculumReleaseId,
    lessonId: current.lessonId,
    completionSource: value.completionSource,
    completedAt: now
  };

  // The repository owns the atomic progress + event write. No mastery port is
  // available here, so content completion cannot grant skill mastery.
  return dependencies.progress.completeWithEvent(completed, event);
}

const assessmentSubmissionSchema = assessmentAttemptInputSchema.omit({
  id: true,
  learnerId: true,
  assessedAt: true
});

export type AssessmentSubmission = z.input<typeof assessmentSubmissionSchema>;

export async function recordAssessmentAttempt(
  input: { learnerId: string; submission: unknown },
  dependencies: {
    curriculum: CurriculumRepository;
    skills: SkillRepository;
    assessments: AssessmentAttemptRepository;
    runtime: ApplicationRuntime;
  }
): Promise<AssessmentAttemptRecord> {
  const learnerId = parseInput(uuidSchema, input.learnerId);
  const submission = parseInput(assessmentSubmissionSchema, input.submission);

  if (
    !(await dependencies.skills.findForRelease(
      submission.curriculumReleaseId,
      submission.skillId
    ))
  ) {
    throw new NotFoundError('Skill not found in this curriculum release.');
  }

  if (
    submission.lessonId &&
    !(await dependencies.curriculum.findLesson(
      submission.curriculumReleaseId,
      submission.lessonId
    ))
  ) {
    throw new NotFoundError(
      'Lesson context not found in this curriculum release.'
    );
  }

  const assessedAt = dependencies.runtime.now();
  const attempt: AssessmentAttemptInput = parseInput(
    assessmentAttemptInputSchema,
    {
      ...submission,
      id: dependencies.runtime.newId(),
      learnerId,
      assessedAt
    }
  );
  const record: AssessmentAttemptRecord = {
    ...attempt,
    recordedAt: assessedAt
  };

  await dependencies.assessments.append(record);
  return record;
}

const masteryDecisionSchema = z
  .object({
    learnerId: uuidSchema,
    releaseId: releaseIdSchema,
    skillId: skillIdSchema,
    state: skillMasteryStateSchema,
    confidence: z.number().int().min(0).max(100).nullable(),
    nextReviewAt: z.number().int().nonnegative().nullable()
  })
  .strict();

export async function updateSkillMasteryFromEvidence(
  input: unknown,
  dependencies: {
    curriculum: CurriculumRepository;
    skills: SkillRepository;
    assessments: AssessmentAttemptRepository;
    mastery: SkillMasteryRepository;
    runtime: ApplicationRuntime;
  }
): Promise<SkillMasteryRecord> {
  const value = parseInput(masteryDecisionSchema, input);
  if (!(await dependencies.curriculum.findRelease(value.releaseId))) {
    throw new NotFoundError('Curriculum release not found.');
  }
  if (
    !(await dependencies.skills.findForRelease(value.releaseId, value.skillId))
  ) {
    throw new NotFoundError('Skill not found in this curriculum release.');
  }

  const attempts = (
    await dependencies.assessments.listBySkill(
      value.learnerId,
      value.releaseId,
      value.skillId
    )
  )
    .filter(
      (attempt) =>
        attempt.learnerId === value.learnerId &&
        attempt.curriculumReleaseId === value.releaseId &&
        attempt.skillId === value.skillId
    )
    .sort(
      (left, right) =>
        left.assessedAt - right.assessedAt ||
        left.recordedAt - right.recordedAt ||
        left.id.localeCompare(right.id)
    );
  const latest = attempts.at(-1) ?? null;

  if (value.state === 'stable' && (!latest || latest.outcome !== 'passed')) {
    throw new InvalidStateError(
      'Stable mastery requires the latest assessment for this skill to pass.'
    );
  }

  const snapshot = parseInput(skillMasteryUpdateSchema, {
    learnerId: value.learnerId,
    curriculumReleaseId: value.releaseId,
    skillId: value.skillId,
    state: value.state,
    evidenceCount: attempts.length,
    confidence: value.confidence,
    lastAssessmentId: latest?.id ?? null,
    lastAssessedAt: latest?.assessedAt ?? null,
    nextReviewAt: value.nextReviewAt
  });

  const record: SkillMasteryRecord = {
    ...snapshot,
    updatedAt: dependencies.runtime.now()
  };
  await dependencies.mastery.save(record);
  return record;
}

const startPracticeInputSchema = z
  .object({
    learnerId: uuidSchema,
    plannedMinutes: z.number().int().min(1).max(180).nullable(),
    primaryCurriculumReleaseId: releaseIdSchema.nullable(),
    primaryLessonId: lessonIdSchema.nullable(),
    focus: z.string().trim().min(1).max(180).nullable()
  })
  .strict()
  .superRefine((value, context) => {
    if (
      (value.primaryCurriculumReleaseId === null) !==
      (value.primaryLessonId === null)
    ) {
      context.addIssue({
        code: 'custom',
        path: ['primaryLessonId'],
        message:
          'A primary lesson requires both a release and lesson identifier.'
      });
    }
  });

export async function startPracticeSession(
  input: unknown,
  dependencies: {
    curriculum: CurriculumRepository;
    practice: PracticeSessionRepository;
    runtime: ApplicationRuntime;
  }
): Promise<PracticeSessionRecord> {
  const value = parseInput(startPracticeInputSchema, input);
  if (
    value.primaryCurriculumReleaseId &&
    value.primaryLessonId &&
    !(await dependencies.curriculum.findLesson(
      value.primaryCurriculumReleaseId,
      value.primaryLessonId
    ))
  ) {
    throw new NotFoundError(
      'Practice lesson not found in this curriculum release.'
    );
  }

  const now = dependencies.runtime.now();
  const session: PracticeSessionRecord = {
    id: dependencies.runtime.newId(),
    learnerId: value.learnerId,
    primaryCurriculumReleaseId: value.primaryCurriculumReleaseId,
    primaryLessonId: value.primaryLessonId,
    status: 'in_progress',
    plannedMinutes: value.plannedMinutes,
    actualDurationSeconds: 0,
    focus: value.focus,
    difficulty: null,
    reflection: null,
    startedAt: now,
    endedAt: null,
    createdAt: now,
    updatedAt: now
  };

  await dependencies.practice.create(session);
  return session;
}

const finishPracticeInputSchema = z
  .object({
    learnerId: uuidSchema,
    sessionId: uuidSchema,
    actualDurationSeconds: z.number().int().min(1).max(43_200)
  })
  .strict();

export async function finishPracticeSession(
  input: unknown,
  dependencies: {
    practice: PracticeSessionRepository;
    runtime: ApplicationRuntime;
  }
): Promise<PracticeSessionRecord> {
  const value = parseInput(finishPracticeInputSchema, input);
  const current = await dependencies.practice.findById(value.sessionId);
  if (!current || current.learnerId !== value.learnerId) {
    throw new NotFoundError('Practice session not found.');
  }
  if (current.status !== 'in_progress') {
    throw new ConflictError(
      'Only an active practice session can be completed.'
    );
  }

  const now = dependencies.runtime.now();
  if (now < current.startedAt) {
    throw new InvalidStateError(
      'The practice clock is earlier than the session start.'
    );
  }

  const completed: PracticeSessionRecord = {
    ...current,
    status: 'completed',
    actualDurationSeconds: value.actualDurationSeconds,
    endedAt: now,
    updatedAt: now
  };

  if (!(await dependencies.practice.updateIfInProgress(completed))) {
    throw new ConflictError('This practice session was already updated.');
  }

  // Practice duration is activity metadata, never assessment evidence.
  return completed;
}
