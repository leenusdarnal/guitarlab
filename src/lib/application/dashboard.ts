import type {
  LearnerProfileRecord,
  LessonProgressRecord,
  PracticeSessionRecord,
  SkillMasteryRecord
} from '../repositories/contracts';

export type DashboardLesson = {
  id: string;
  week: number;
  title: string;
  focus: string;
  estimatedMinutes: number;
};

export type DashboardPhase = {
  id: string;
  title: string;
  firstWeek: number;
  lastWeek: number;
  goal: string;
};

export type DashboardSnapshot = {
  learnerId: string;
  practiceMinutes: number | null;
  learnerGoals: string[];
  isFreshStart: boolean;
  completedLessons: number;
  totalLessons: number;
  nextLesson: DashboardLesson | null;
  nextLessonIsInProgress: boolean;
  currentPhase: string | null;
  phases: Array<DashboardPhase & {
    completedLessons: number;
    totalLessons: number;
    isCurrent: boolean;
  }>;
  dueReviews: Array<{
    skillId: string;
    state: string;
    confidence: number | null;
    nextReviewAt: number;
  }>;
  recentPractice: PracticeSessionRecord[];
};

/**
 * Application-layer dashboard read model. It combines public curriculum data
 * with learner-owned evidence without turning lesson completion into mastery.
 */
export function buildDashboardSnapshot(input: {
  profile: LearnerProfileRecord;
  lessons: DashboardLesson[];
  phases: DashboardPhase[];
  progress: LessonProgressRecord[];
  mastery: SkillMasteryRecord[];
  practiceSessions: PracticeSessionRecord[];
  now: number;
}): DashboardSnapshot {
  const { profile, lessons, phases, now } = input;
  const orderedLessons = [...lessons].sort(
    (left, right) => left.week - right.week || left.id.localeCompare(right.id)
  );
  const lessonIds = new Set(orderedLessons.map((lesson) => lesson.id));
  const learnerProgress = input.progress.filter(
    (record) => record.learnerId === profile.id && lessonIds.has(record.lessonId)
  );
  const completedIds = new Set(
    learnerProgress
      .filter((record) => record.status === 'completed')
      .map((record) => record.lessonId)
  );
  const inProgressIds = new Set(
    learnerProgress
      .filter((record) => record.status === 'in_progress')
      .map((record) => record.lessonId)
  );

  const nextLesson =
    orderedLessons.find((lesson) => inProgressIds.has(lesson.id)) ??
    orderedLessons.find((lesson) => !completedIds.has(lesson.id)) ??
    null;
  const currentPhase =
    phases.find(
      (phase) =>
        nextLesson !== null &&
        nextLesson.week >= phase.firstWeek &&
        nextLesson.week <= phase.lastWeek
    )?.title ?? null;

  const phaseSummaries = phases.map((phase) => {
    const phaseLessons = orderedLessons.filter(
      (lesson) =>
        lesson.week >= phase.firstWeek && lesson.week <= phase.lastWeek
    );
    const completedLessons = phaseLessons.filter((lesson) =>
      completedIds.has(lesson.id)
    ).length;
    return {
      ...phase,
      completedLessons,
      totalLessons: phaseLessons.length,
      isCurrent:
        nextLesson !== null &&
        nextLesson.week >= phase.firstWeek &&
        nextLesson.week <= phase.lastWeek
    };
  });

  const dueReviews = input.mastery
    .filter(
      (record) =>
        record.learnerId === profile.id &&
        record.nextReviewAt !== null &&
        record.nextReviewAt <= now
    )
    .map((record) => ({
      skillId: record.skillId,
      state: record.state,
      confidence: record.confidence,
      nextReviewAt: record.nextReviewAt as number
    }))
    .sort((left, right) => left.nextReviewAt - right.nextReviewAt);

  const recentPractice = input.practiceSessions
    .filter((session) => session.learnerId === profile.id)
    .sort(
      (left, right) =>
        right.startedAt - left.startedAt || right.id.localeCompare(left.id)
    )
    .slice(0, 3);

  return {
    learnerId: profile.id,
    practiceMinutes: profile.preferences.practiceMinutes,
    learnerGoals: [...profile.preferences.goals],
    isFreshStart: completedIds.size === 0 && inProgressIds.size === 0,
    completedLessons: completedIds.size,
    totalLessons: orderedLessons.length,
    nextLesson,
    nextLessonIsInProgress: nextLesson !== null && inProgressIds.has(nextLesson.id),
    currentPhase,
    phases: phaseSummaries,
    dueReviews,
    recentPractice
  };
}
