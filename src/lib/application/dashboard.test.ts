import { describe, expect, it } from 'vitest';
import { createEmptyProfilePreferences } from '../domain/profile/preferences';
import type {
  LearnerProfileRecord,
  LessonProgressRecord,
  PracticeSessionRecord,
  SkillMasteryRecord
} from '../repositories/contracts';
import { buildDashboardSnapshot } from './dashboard';

const profile: LearnerProfileRecord = {
  id: 'learner-1',
  preferencesSchemaVersion: 1,
  preferences: createEmptyProfilePreferences(),
  createdAt: 1,
  updatedAt: 1,
  lastActiveAt: null
};
const lessons = [
  { id: 'lesson-1', week: 1, title: 'Meet your guitar', focus: 'Setup', estimatedMinutes: 30 },
  { id: 'lesson-2', week: 2, title: 'Clear single notes', focus: 'Tone', estimatedMinutes: 25 }
];
const phases = [
  { id: 'beginner-base', title: 'Beginner base', firstWeek: 1, lastWeek: 12, goal: 'Build foundations' }
];

function progress(
  lessonId: string,
  status: LessonProgressRecord['status'],
  learnerId = profile.id
): LessonProgressRecord {
  return {
    id: `progress-${lessonId}`,
    learnerId,
    curriculumReleaseId: 'release-1',
    lessonId,
    status,
    lastBlockId: null,
    startedAt: 10,
    completedAt: status === 'completed' ? 20 : null,
    updatedAt: 20
  };
}

function practice(id: string, startedAt: number, learnerId = profile.id): PracticeSessionRecord {
  return {
    id,
    learnerId,
    primaryCurriculumReleaseId: null,
    primaryLessonId: null,
    status: 'completed',
    plannedMinutes: 20,
    actualDurationSeconds: 600,
    focus: 'Pulse',
    difficulty: null,
    reflection: null,
    startedAt,
    endedAt: startedAt + 600,
    createdAt: startedAt,
    updatedAt: startedAt + 600
  };
}

function mastery(nextReviewAt: number, learnerId = profile.id): SkillMasteryRecord {
  return {
    learnerId,
    curriculumReleaseId: 'release-1',
    skillId: 'rhythm.pulse',
    state: 'practising',
    evidenceCount: 1,
    confidence: 60,
    lastAssessmentId: 'attempt-1',
    lastAssessedAt: 100,
    nextReviewAt,
    updatedAt: 100
  };
}

function snapshot(input: {
  progress?: LessonProgressRecord[];
  mastery?: SkillMasteryRecord[];
  practiceSessions?: PracticeSessionRecord[];
  now?: number;
} = {}) {
  return buildDashboardSnapshot({
    profile,
    lessons,
    phases,
    progress: input.progress ?? [],
    mastery: input.mastery ?? [],
    practiceSessions: input.practiceSessions ?? [],
    now: input.now ?? 1_000
  });
}

describe('learner dashboard read model', () => {
  it('shows a truthful fresh start at Year 1 Week 1', () => {
    const result = snapshot();
    expect(result.isFreshStart).toBe(true);
    expect(result.nextLesson).toMatchObject({ id: 'lesson-1', week: 1 });
    expect(result.completedLessons).toBe(0);
    expect(result.practiceMinutes).toBeNull();
    expect(result.dueReviews).toEqual([]);
    expect(result.recentPractice).toEqual([]);
  });

  it('resumes the earliest in-progress lesson without marking it complete', () => {
    const result = snapshot({ progress: [progress('lesson-1', 'in_progress')] });
    expect(result.nextLesson?.id).toBe('lesson-1');
    expect(result.completedLessons).toBe(0);
    expect(result.isFreshStart).toBe(false);
  });

  it('moves to the next lesson only after recorded completion', () => {
    const result = snapshot({ progress: [progress('lesson-1', 'completed')] });
    expect(result.nextLesson?.id).toBe('lesson-2');
    expect(result.completedLessons).toBe(1);
    expect(result.phases[0].completedLessons).toBe(1);
  });

  it('shows only due reviews and excludes other learners', () => {
    const result = snapshot({
      mastery: [mastery(900), mastery(1, 'another-learner'), mastery(1_500)],
      now: 1_000
    });
    expect(result.dueReviews).toHaveLength(1);
    expect(result.dueReviews[0].skillId).toBe('rhythm.pulse');
  });

  it('returns the three most recent practice sessions for the active learner', () => {
    const result = snapshot({
      practiceSessions: [
        practice('older', 10),
        practice('newer', 30),
        practice('middle', 20),
        practice('other-learner', 40, 'another-learner')
      ]
    });
    expect(result.recentPractice.map((session) => session.id)).toEqual([
      'newer',
      'middle',
      'older'
    ]);
  });
});
