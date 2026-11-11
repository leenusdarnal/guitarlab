import { z } from 'zod';
import { assessmentAttemptInputSchema } from '../domain/learning/assessment';
import { skillMasteryUpdateSchema } from '../domain/learning/mastery';
import { profilePreferencesSchema } from '../domain/profile/preferences';

export const LEARNER_BACKUP_FORMAT = 'guitarlab-learner-backup' as const;
export const LEARNER_BACKUP_VERSION = 1 as const;
export const LEARNER_BACKUP_MAX_CHARACTERS = 10_000_000;

const id = z.string().uuid();
const timestamp = z.number().int().nonnegative();
const boundedRecords = <T extends z.ZodTypeAny>(schema: T) =>
  z.array(schema).max(10_000);

const learnerProfileSchema = z.object({
  id,
  preferencesSchemaVersion: z.literal(1),
  preferences: profilePreferencesSchema.strict(),
  createdAt: timestamp,
  updatedAt: timestamp,
  lastActiveAt: timestamp.nullable()
}).strict();

const lessonProgressSchema = z.object({
  id,
  learnerId: id,
  curriculumReleaseId: z.string().min(1).max(100),
  lessonId: z.string().min(1).max(160),
  status: z.enum(['in_progress', 'completed']),
  lastBlockId: z.string().max(160).nullable(),
  completedBlockIds: z
    .array(z.string().min(1).max(160))
    .max(200)
    .optional(),
  revision: z.number().int().nonnegative().optional(),
  checkpointOutcome: z
    .enum(['achieved', 'needs_practice'])
    .nullable()
    .optional(),
  checkpointNote: z.string().max(500).nullable().optional(),
  startedAt: timestamp,
  completedAt: timestamp.nullable(),
  updatedAt: timestamp
}).strict();

const lessonCompletionEventSchema = z.object({
  id,
  progressId: id,
  learnerId: id,
  curriculumReleaseId: z.string().min(1).max(100),
  lessonId: z.string().min(1).max(160),
  completionSource: z.enum(['checkpoint', 'learner_confirmed', 'resume_recovery']),
  completedAt: timestamp
}).strict();

const assessmentAttemptSchema = assessmentAttemptInputSchema
  .extend({ recordedAt: timestamp })
  .strict();

const skillMasterySchema = z.intersection(
  skillMasteryUpdateSchema,
  z.object({ updatedAt: timestamp }).strict()
);

const practiceSessionSchema = z.object({
  id,
  learnerId: id,
  primaryCurriculumReleaseId: z.string().min(1).max(100).nullable(),
  primaryLessonId: z.string().min(1).max(160).nullable(),
  status: z.enum(['in_progress', 'completed', 'abandoned']),
  plannedMinutes: z.number().int().min(1).max(600).nullable(),
  actualDurationSeconds: z.number().int().nonnegative(),
  focus: z.string().max(1000).nullable(),
  difficulty: z.number().int().min(1).max(5).nullable(),
  reflection: z.string().max(2000).nullable(),
  startedAt: timestamp,
  endedAt: timestamp.nullable(),
  createdAt: timestamp,
  updatedAt: timestamp
}).strict();

export const learnerBackupRecordsSchema = z.object({
  profile: learnerProfileSchema,
  lessonProgress: boundedRecords(lessonProgressSchema),
  completionEvents: boundedRecords(lessonCompletionEventSchema),
  assessmentAttempts: boundedRecords(assessmentAttemptSchema),
  skillMastery: boundedRecords(skillMasterySchema),
  practiceSessions: boundedRecords(practiceSessionSchema)
}).strict();

export type LearnerBackupRecords = z.infer<typeof learnerBackupRecordsSchema>;

export const learnerBackupSchema = z.object({
  format: z.literal(LEARNER_BACKUP_FORMAT),
  version: z.literal(LEARNER_BACKUP_VERSION),
  exportedAt: timestamp,
  learnerId: id,
  records: learnerBackupRecordsSchema
}).strict().superRefine((backup, context) => {
  const { learnerId, records } = backup;

  if (records.profile.id !== learnerId) {
    context.addIssue({
      code: 'custom',
      path: ['records', 'profile', 'id'],
      message: 'The profile ID must match the backup learner ID.'
    });
  }

  const learnerIds = [
    ...records.lessonProgress.map((record) => record.learnerId),
    ...records.completionEvents.map((record) => record.learnerId),
    ...records.assessmentAttempts.map((record) => record.learnerId),
    ...records.skillMastery.map((record) => record.learnerId),
    ...records.practiceSessions.map((record) => record.learnerId)
  ];

  if (learnerIds.some((recordLearnerId) => recordLearnerId !== learnerId)) {
    context.addIssue({
      code: 'custom',
      path: ['records'],
      message: 'Every learner-owned record must belong to the exported profile.'
    });
  }

  const uniqueCollections: Array<[string, string[]]> = [
    ['lessonProgress', records.lessonProgress.map((record) => record.id)],
    ['completionEvents', records.completionEvents.map((record) => record.id)],
    ['assessmentAttempts', records.assessmentAttempts.map((record) => record.id)],
    ['skillMastery', records.skillMastery.map((record) =>
      `${record.learnerId}:${record.curriculumReleaseId}:${record.skillId}`) ],
    ['practiceSessions', records.practiceSessions.map((record) => record.id)]
  ];

  for (const [collection, keys] of uniqueCollections) {
    if (new Set(keys).size !== keys.length) {
      context.addIssue({
        code: 'custom',
        path: ['records', collection],
        message: 'A backup cannot contain duplicate record keys.'
      });
    }
  }

  const progressIds = new Set(records.lessonProgress.map((record) => record.id));
  if (records.completionEvents.some((event) => !progressIds.has(event.progressId))) {
    context.addIssue({
      code: 'custom',
      path: ['records', 'completionEvents'],
      message: 'Every completion event must reference an included progress record.'
    });
  }

  const assessmentIds = new Set(records.assessmentAttempts.map((attempt) => attempt.id));
  if (records.skillMastery.some((snapshot) =>
    snapshot.lastAssessmentId !== null && !assessmentIds.has(snapshot.lastAssessmentId)
  )) {
    context.addIssue({
      code: 'custom',
      path: ['records', 'skillMastery'],
      message: 'A mastery snapshot must reference an included assessment attempt.'
    });
  }
});

export type LearnerBackup = z.infer<typeof learnerBackupSchema>;

export type BackupParseResult =
  | { success: true; data: LearnerBackup }
  | { success: false; message: string };

export function parseLearnerBackup(input: unknown): BackupParseResult {
  const parsed = learnerBackupSchema.safeParse(input);
  if (parsed.success) return { success: true, data: parsed.data };

  const issue = parsed.error.issues[0];
  return {
    success: false,
    message: issue
      ? `${issue.path.join('.') || 'Backup'}: ${issue.message}`
      : 'This backup is not valid.'
  };
}

/** Parse untrusted file text before any database write is attempted. */
export function parseLearnerBackupJson(contents: string): BackupParseResult {
  if (contents.length > LEARNER_BACKUP_MAX_CHARACTERS) {
    return {
      success: false,
      message: 'This backup is too large to import (maximum 10 MB of text).'
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(contents) as unknown;
  } catch {
    return { success: false, message: 'The selected file is not valid JSON.' };
  }

  return parseLearnerBackup(value);
}

type RecordChange = { add: number; replace: number; remove: number };

function compareRecords<T>(
  incoming: T[],
  existing: T[],
  keyOf: (record: T) => string
): RecordChange {
  const incomingKeys = new Set(incoming.map(keyOf));
  const existingKeys = new Set(existing.map(keyOf));
  let replace = 0;

  for (const key of incomingKeys) {
    if (existingKeys.has(key)) replace += 1;
  }

  return {
    add: incomingKeys.size - replace,
    replace,
    remove: [...existingKeys].filter((key) => !incomingKeys.has(key)).length
  };
}

export type RestorePreview = {
  replacesActiveProfile: boolean;
  records: {
    profile: RecordChange;
    lessonProgress: RecordChange;
    completionEvents: RecordChange;
    assessmentAttempts: RecordChange;
    skillMastery: RecordChange;
    practiceSessions: RecordChange;
  };
  totals: RecordChange;
};

/** Non-mutating preview for a replacement restore; records are never merged across learners. */
export function createRestorePreview(
  incoming: LearnerBackup,
  existing: LearnerBackupRecords | null
): RestorePreview {
  const records = {
    profile: {
      add: existing ? 0 : 1,
      replace: existing ? 1 : 0,
      remove: 0
    },
    lessonProgress: compareRecords(
      incoming.records.lessonProgress,
      existing?.lessonProgress ?? [],
      (record) => record.id
    ),
    completionEvents: compareRecords(
      incoming.records.completionEvents,
      existing?.completionEvents ?? [],
      (record) => record.id
    ),
    assessmentAttempts: compareRecords(
      incoming.records.assessmentAttempts,
      existing?.assessmentAttempts ?? [],
      (record) => record.id
    ),
    skillMastery: compareRecords(
      incoming.records.skillMastery,
      existing?.skillMastery ?? [],
      (record) => `${record.learnerId}:${record.curriculumReleaseId}:${record.skillId}`
    ),
    practiceSessions: compareRecords(
      incoming.records.practiceSessions,
      existing?.practiceSessions ?? [],
      (record) => record.id
    )
  };

  const totals = Object.values(records).reduce(
    (total, value) => ({
      add: total.add + value.add,
      replace: total.replace + value.replace,
      remove: total.remove + value.remove
    }),
    { add: 0, replace: 0, remove: 0 }
  );

  return {
    replacesActiveProfile: existing !== null && existing.profile.id !== incoming.learnerId,
    records,
    totals
  };
}
