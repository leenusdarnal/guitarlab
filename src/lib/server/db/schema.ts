import { sql } from 'drizzle-orm';
import {
  check,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex
} from 'drizzle-orm/sqlite-core';

export const curriculumReleases = sqliteTable(
  'curriculum_releases',
  {
    id: text('id').primaryKey(),
    version: text('version').notNull(),
    schemaVersion: integer('schema_version').notNull(),
    contentHash: text('content_hash').notNull(),
    publishedAt: integer('published_at').notNull(),
    status: text('status', { enum: ['published', 'retired'] })
      .notNull()
      .default('published')
  },
  (table) => [
    uniqueIndex('curriculum_releases_version_unique').on(table.version),
    check(
      'curriculum_releases_schema_version_positive',
      sql.raw('schema_version > 0')
    ),
    check(
      'curriculum_releases_content_hash_sha256',
      sql.raw('length(content_hash) = 64')
    )
  ]
);

/** Versioned metadata index only. Full lesson bodies remain in content/curriculum. */
export const curriculumLessons = sqliteTable(
  'curriculum_lessons',
  {
    releaseId: text('release_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    curriculumId: text('curriculum_id').notNull(),
    curriculumWeekId: text('curriculum_week_id').notNull(),
    week: integer('week').notNull(),
    route: text('route').notNull(),
    title: text('title').notNull(),
    focus: text('focus').notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.releaseId, table.lessonId] }),
    foreignKey({
      columns: [table.releaseId],
      foreignColumns: [curriculumReleases.id],
      name: 'curriculum_lessons_release_fk'
    }).onDelete('restrict'),
    index('curriculum_lessons_curriculum_week_idx').on(
      table.releaseId,
      table.curriculumId,
      table.week
    ),
    check('curriculum_lessons_week_positive', sql.raw('week > 0')),
    check(
      'curriculum_lessons_estimated_minutes_range',
      sql.raw('estimated_minutes between 1 and 180')
    )
  ]
);

export const skills = sqliteTable(
  'skills',
  {
    id: text('id').primaryKey(),
    category: text('category').notNull(),
    displayName: text('display_name').notNull()
  },
  (table) => [index('skills_category_idx').on(table.category)]
);

export const curriculumReleaseSkills = sqliteTable(
  'curriculum_release_skills',
  {
    releaseId: text('release_id').notNull(),
    skillId: text('skill_id').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.releaseId, table.skillId] }),
    foreignKey({
      columns: [table.releaseId],
      foreignColumns: [curriculumReleases.id],
      name: 'curriculum_release_skills_release_fk'
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.skillId],
      foreignColumns: [skills.id],
      name: 'curriculum_release_skills_skill_fk'
    }).onDelete('restrict')
  ]
);

const emptyPreferences = JSON.stringify({
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

export const learnerProfiles = sqliteTable(
  'learner_profiles',
  {
    id: text('id').primaryKey(),
    preferencesSchemaVersion: integer('preferences_schema_version')
      .notNull()
      .default(1),
    preferencesJson: text('preferences_json')
      .notNull()
      .default(emptyPreferences),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
    lastActiveAt: integer('last_active_at')
  },
  (table) => [
    check(
      'learner_profiles_preferences_json_valid',
      sql.raw('json_valid(preferences_json)')
    ),
    check(
      'learner_profiles_preferences_schema_positive',
      sql.raw('preferences_schema_version > 0')
    ),
    index('learner_profiles_last_active_idx').on(table.lastActiveAt)
  ]
);

export const lessonProgress = sqliteTable(
  'lesson_progress',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id').notNull(),
    curriculumReleaseId: text('curriculum_release_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    status: text('status', { enum: ['in_progress', 'completed'] })
      .notNull()
      .default('in_progress'),
    lastBlockId: text('last_block_id'),
    startedAt: integer('started_at').notNull(),
    completedAt: integer('completed_at'),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.learnerId],
      foreignColumns: [learnerProfiles.id],
      name: 'lesson_progress_learner_fk'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.curriculumReleaseId, table.lessonId],
      foreignColumns: [curriculumLessons.releaseId, curriculumLessons.lessonId],
      name: 'lesson_progress_curriculum_lesson_fk'
    }).onDelete('restrict'),
    uniqueIndex('lesson_progress_learner_release_lesson_unique').on(
      table.learnerId,
      table.curriculumReleaseId,
      table.lessonId
    ),
    uniqueIndex('lesson_progress_id_learner_unique').on(
      table.id,
      table.learnerId
    ),
    index('lesson_progress_learner_status_idx').on(
      table.learnerId,
      table.status
    ),
    check(
      'lesson_progress_completion_timestamp_consistent',
      sql.raw(
        "(status = 'in_progress' and completed_at is null) or (status = 'completed' and completed_at is not null)"
      )
    )
  ]
);

/** Immutable event record: completing lesson content never creates skill mastery. */
export const lessonCompletionEvents = sqliteTable(
  'lesson_completion_events',
  {
    id: text('id').primaryKey(),
    progressId: text('progress_id').notNull(),
    learnerId: text('learner_id').notNull(),
    curriculumReleaseId: text('curriculum_release_id').notNull(),
    lessonId: text('lesson_id').notNull(),
    completionSource: text('completion_source', {
      enum: ['checkpoint', 'learner_confirmed', 'resume_recovery']
    }).notNull(),
    completedAt: integer('completed_at').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.progressId, table.learnerId],
      foreignColumns: [lessonProgress.id, lessonProgress.learnerId],
      name: 'lesson_completion_events_progress_owner_fk'
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.curriculumReleaseId, table.lessonId],
      foreignColumns: [curriculumLessons.releaseId, curriculumLessons.lessonId],
      name: 'lesson_completion_events_curriculum_lesson_fk'
    }).onDelete('restrict'),
    index('lesson_completion_events_learner_completed_idx').on(
      table.learnerId,
      table.completedAt
    )
  ]
);

export const skillAssessmentAttempts = sqliteTable(
  'skill_assessment_attempts',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id').notNull(),
    curriculumReleaseId: text('curriculum_release_id').notNull(),
    skillId: text('skill_id').notNull(),
    lessonId: text('lesson_id'),
    assessmentKind: text('assessment_kind', {
      enum: ['checkpoint', 'guided_self_check', 'recording_review', 'measured']
    }).notNull(),
    evidenceType: text('evidence_type', {
      enum: [
        'measured',
        'observed_or_self_checked',
        'self_reported',
        'recording_reviewed'
      ]
    }).notNull(),
    outcome: text('outcome', {
      enum: ['passed', 'needs_practice', 'inconclusive']
    }).notNull(),
    score: integer('score'),
    evidenceSummary: text('evidence_summary'),
    evidenceJson: text('evidence_json').notNull().default('{}'),
    assessedAt: integer('assessed_at').notNull(),
    recordedAt: integer('recorded_at').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.learnerId],
      foreignColumns: [learnerProfiles.id],
      name: 'skill_assessment_attempts_learner_fk'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.curriculumReleaseId, table.skillId],
      foreignColumns: [
        curriculumReleaseSkills.releaseId,
        curriculumReleaseSkills.skillId
      ],
      name: 'skill_assessment_attempts_release_skill_fk'
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.curriculumReleaseId, table.lessonId],
      foreignColumns: [curriculumLessons.releaseId, curriculumLessons.lessonId],
      name: 'skill_assessment_attempts_lesson_fk'
    }).onDelete('restrict'),
    uniqueIndex('skill_assessment_attempts_mastery_fk_unique').on(
      table.id,
      table.learnerId,
      table.skillId,
      table.curriculumReleaseId
    ),
    index('skill_assessment_attempts_learner_skill_time_idx').on(
      table.learnerId,
      table.skillId,
      table.assessedAt
    ),
    check(
      'skill_assessment_attempts_score_range',
      sql.raw('score is null or score between 0 and 100')
    ),
    check(
      'skill_assessment_attempts_summary_length',
      sql.raw('evidence_summary is null or length(evidence_summary) <= 1000')
    ),
    check(
      'skill_assessment_attempts_evidence_json_valid',
      sql.raw('json_valid(evidence_json)')
    )
  ]
);

/** Current mastery is a derived snapshot with an evidence-provenance pointer. */
export const skillMastery = sqliteTable(
  'skill_mastery',
  {
    learnerId: text('learner_id').notNull(),
    curriculumReleaseId: text('curriculum_release_id').notNull(),
    skillId: text('skill_id').notNull(),
    state: text('state', {
      enum: ['not_started', 'learning', 'practising', 'stable', 'review_due']
    }).notNull(),
    evidenceCount: integer('evidence_count').notNull().default(0),
    confidence: integer('confidence'),
    lastAssessmentId: text('last_assessment_id'),
    lastAssessedAt: integer('last_assessed_at'),
    nextReviewAt: integer('next_review_at'),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [
    primaryKey({
      columns: [table.learnerId, table.curriculumReleaseId, table.skillId]
    }),
    foreignKey({
      columns: [table.learnerId],
      foreignColumns: [learnerProfiles.id],
      name: 'skill_mastery_learner_fk'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.curriculumReleaseId, table.skillId],
      foreignColumns: [
        curriculumReleaseSkills.releaseId,
        curriculumReleaseSkills.skillId
      ],
      name: 'skill_mastery_release_skill_fk'
    }).onDelete('restrict'),
    foreignKey({
      columns: [
        table.lastAssessmentId,
        table.learnerId,
        table.skillId,
        table.curriculumReleaseId
      ],
      foreignColumns: [
        skillAssessmentAttempts.id,
        skillAssessmentAttempts.learnerId,
        skillAssessmentAttempts.skillId,
        skillAssessmentAttempts.curriculumReleaseId
      ],
      name: 'skill_mastery_last_assessment_owner_fk'
    }).onDelete('restrict'),
    index('skill_mastery_learner_state_idx').on(table.learnerId, table.state),
    check(
      'skill_mastery_evidence_count_nonnegative',
      sql.raw('evidence_count >= 0')
    ),
    check(
      'skill_mastery_confidence_range',
      sql.raw('confidence is null or confidence between 0 and 100')
    ),
    check(
      'skill_mastery_stable_requires_evidence',
      sql.raw(
        "state <> 'stable' or (evidence_count > 0 and last_assessment_id is not null)"
      )
    )
  ]
);

export const practiceSessions = sqliteTable(
  'practice_sessions',
  {
    id: text('id').primaryKey(),
    learnerId: text('learner_id').notNull(),
    primaryCurriculumReleaseId: text('primary_curriculum_release_id'),
    primaryLessonId: text('primary_lesson_id'),
    status: text('status', {
      enum: ['in_progress', 'paused', 'completed', 'abandoned']
    })
      .notNull()
      .default('in_progress'),
    plannedMinutes: integer('planned_minutes'),
    actualDurationSeconds: integer('actual_duration_seconds')
      .notNull()
      .default(0),
    focus: text('focus'),
    difficulty: integer('difficulty'),
    reflection: text('reflection'),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull()
  },
  (table) => [
    foreignKey({
      columns: [table.learnerId],
      foreignColumns: [learnerProfiles.id],
      name: 'practice_sessions_learner_fk'
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.primaryCurriculumReleaseId, table.primaryLessonId],
      foreignColumns: [curriculumLessons.releaseId, curriculumLessons.lessonId],
      name: 'practice_sessions_primary_lesson_fk'
    }).onDelete('restrict'),
    index('practice_sessions_learner_started_idx').on(
      table.learnerId,
      table.startedAt
    ),
    check(
      'practice_sessions_planned_minutes_range',
      sql.raw('planned_minutes is null or planned_minutes between 1 and 180')
    ),
    check(
      'practice_sessions_actual_duration_nonnegative',
      sql.raw('actual_duration_seconds between 0 and 43200')
    ),
    check(
      'practice_sessions_difficulty_range',
      sql.raw('difficulty is null or difficulty between 1 and 5')
    ),
    check(
      'practice_sessions_primary_lesson_pair',
      sql.raw(
        '(primary_curriculum_release_id is null and primary_lesson_id is null) or (primary_curriculum_release_id is not null and primary_lesson_id is not null)'
      )
    ),
    check(
      'practice_sessions_status_timestamps_consistent',
      sql.raw(
        "(status in ('in_progress', 'paused') and ended_at is null) or (status in ('completed', 'abandoned') and ended_at is not null)"
      )
    ),
    check(
      'practice_sessions_completed_duration_positive',
      sql.raw("status <> 'completed' or actual_duration_seconds > 0")
    ),
    check(
      'practice_sessions_reflection_length',
      sql.raw('reflection is null or length(reflection) <= 2000')
    )
  ]
);

export type CurriculumRelease = typeof curriculumReleases.$inferSelect;
export type NewLearnerProfile = typeof learnerProfiles.$inferInsert;
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type SkillAssessmentAttempt =
  typeof skillAssessmentAttempts.$inferSelect;
export type SkillMastery = typeof skillMastery.$inferSelect;
export type PracticeSession = typeof practiceSessions.$inferSelect;

export const databaseSchema = {
  curriculumReleases,
  curriculumLessons,
  skills,
  curriculumReleaseSkills,
  learnerProfiles,
  lessonProgress,
  lessonCompletionEvents,
  skillAssessmentAttempts,
  skillMastery,
  practiceSessions
};
