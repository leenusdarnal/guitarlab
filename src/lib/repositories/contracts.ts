import type { AssessmentAttemptInput } from '../domain/learning/assessment';
import type { PracticeEvidenceInput } from '../domain/learning/practice-evidence';
import type { SkillMasteryUpdate } from '../domain/learning/mastery';
import type { ProfilePreferences } from '../domain/profile/preferences';

/** Public, versioned curriculum metadata. Lesson bodies remain in Git JSON. */
export type CurriculumReleaseRecord = {
  id: string;
  version: string;
  schemaVersion: number;
  contentHash: string;
  publishedAt: number;
  status: 'published' | 'retired';
};

export type CurriculumLessonRecord = {
  releaseId: string;
  lessonId: string;
  curriculumId: string;
  curriculumWeekId: string;
  week: number;
  route: string;
  title: string;
  focus: string;
  estimatedMinutes: number;
};

export type SkillRecord = {
  id: string;
  category: string;
  displayName: string;
};

/** Private local learner state. This type is never a public curriculum DTO. */
export type LearnerProfileRecord = {
  id: string;
  preferencesSchemaVersion: number;
  preferences: ProfilePreferences;
  createdAt: number;
  updatedAt: number;
  lastActiveAt: number | null;
};

export type LessonProgressRecord = {
  id: string;
  learnerId: string;
  curriculumReleaseId: string;
  lessonId: string;
  status: 'in_progress' | 'completed';
  lastBlockId: string | null;
  /** Completed authored blocks; optional for compatibility with earlier local rows and backups. */
  completedBlockIds?: string[];
  /** Monotonic local revision for stale-tab protection; absent in pre-M4.2 rows. */
  revision?: number;
  /** Learner self-check only; this is not skill mastery evidence. */
  checkpointOutcome?: 'achieved' | 'needs_practice' | null;
  checkpointNote?: string | null;
  startedAt: number;
  completedAt: number | null;
  updatedAt: number;
};

export type LessonCompletionEventRecord = {
  id: string;
  progressId: string;
  learnerId: string;
  curriculumReleaseId: string;
  lessonId: string;
  completionSource: 'checkpoint' | 'learner_confirmed' | 'resume_recovery';
  completedAt: number;
};

export type AssessmentAttemptRecord = AssessmentAttemptInput & {
  recordedAt: number;
};

export type SkillMasteryRecord = SkillMasteryUpdate & {
  updatedAt: number;
};

export type PracticeEvidenceRecord = PracticeEvidenceInput;

export type PracticeSessionRecord = {
  id: string;
  learnerId: string;
  primaryCurriculumReleaseId: string | null;
  primaryLessonId: string | null;
  status: 'in_progress' | 'paused' | 'completed' | 'abandoned';
  /** Start timestamp for the currently running segment; absent on legacy rows. */
  activeStartedAt?: number | null;
  plannedMinutes: number | null;
  actualDurationSeconds: number;
  focus: string | null;
  difficulty: number | null;
  reflection: string | null;
  startedAt: number;
  endedAt: number | null;
  createdAt: number;
  updatedAt: number;
};

export interface LearnerProfileRepository {
  create(profile: LearnerProfileRecord): Promise<void>;
  findById(learnerId: string): Promise<LearnerProfileRecord | null>;
  updatePreferences(
    learnerId: string,
    preferences: ProfilePreferences,
    updatedAt: number
  ): Promise<LearnerProfileRecord | null>;
}

/** Read-only public content path. It must not return learner-owned records. */
export interface CurriculumRepository {
  findRelease(releaseId: string): Promise<CurriculumReleaseRecord | null>;
  listLessons(releaseId: string): Promise<CurriculumLessonRecord[]>;
  findLesson(
    releaseId: string,
    lessonId: string
  ): Promise<CurriculumLessonRecord | null>;
}

/** Skills are versioned through their membership in a curriculum release. */
export interface SkillRepository {
  listForRelease(releaseId: string): Promise<SkillRecord[]>;
  findForRelease(
    releaseId: string,
    skillId: string
  ): Promise<SkillRecord | null>;
}

export interface LessonProgressRepository {
  find(
    learnerId: string,
    releaseId: string,
    lessonId: string
  ): Promise<LessonProgressRecord | null>;
  create(progress: LessonProgressRecord): Promise<void>;
  /** Compare-and-set update: only an in-progress lesson may be changed. */
  updateInProgress(
    progress: LessonProgressRecord,
    expectedRevision: number
  ): Promise<boolean>;
  /**
   * Must persist the completed progress row and append its event atomically.
   * It must never create or update a skill mastery snapshot.
   */
  completeWithEvent(
    progress: LessonProgressRecord,
    event: LessonCompletionEventRecord,
    expectedRevision: number
  ): Promise<LessonProgressRecord | null>;
}

export interface AssessmentAttemptRepository {
  /** Insert-only. Corrections are new attempts; existing attempts are immutable. */
  append(attempt: AssessmentAttemptRecord): Promise<void>;
  listBySkill(
    learnerId: string,
    releaseId: string,
    skillId: string
  ): Promise<AssessmentAttemptRecord[]>;
  findById(attemptId: string): Promise<AssessmentAttemptRecord | null>;
}

export interface SkillMasteryRepository {
  find(
    learnerId: string,
    releaseId: string,
    skillId: string
  ): Promise<SkillMasteryRecord | null>;
  save(snapshot: SkillMasteryRecord): Promise<void>;
}

/** Append-only exercise observations, scoped to one learner and session. */
export interface PracticeEvidenceRepository {
  append(record: PracticeEvidenceRecord): Promise<void>;
  listBySession(
    learnerId: string,
    sessionId: string
  ): Promise<PracticeEvidenceRecord[]>;
}

export interface PracticeSessionRepository {
  create(session: PracticeSessionRecord): Promise<void>;
  findById(sessionId: string): Promise<PracticeSessionRecord | null>;
  /**
   * Compare-and-set update: only the expected active status may be changed.
   * Returns false if another action already changed the session status.
   */
  updateIfStatus(
    session: PracticeSessionRecord,
    expectedStatus: 'in_progress' | 'paused'
  ): Promise<boolean>;
}

/** Injectable system boundary keeps use cases deterministic and testable. */
export interface ApplicationRuntime {
  newId(): string;
  now(): number;
}

export const systemRuntime: ApplicationRuntime = {
  newId: () => crypto.randomUUID(),
  now: () => Date.now()
};
