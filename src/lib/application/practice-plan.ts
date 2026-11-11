export type PracticePlanPreset = 10 | 20 | 40 | 'custom';

export type PracticeLesson = {
  id: string;
  title: string;
  focus: string;
  estimatedMinutes: number;
  isInProgress: boolean;
};

export type PracticeReview = {
  skillId: string;
  state: string;
  confidence: number | null;
  nextReviewAt: number;
};

export type PracticeTaskKind =
  | 'warm-up'
  | 'lesson-focus'
  | 'skill-review'
  | 'musical-application'
  | 'reflection';

export type PracticeRecommendation = {
  id: string;
  kind: PracticeTaskKind;
  title: string;
  minutes: number;
  reason: string;
  skillId?: string;
  lessonId?: string;
};

export type PracticePlan = {
  minutes: number;
  preset: PracticePlanPreset;
  recommendations: PracticeRecommendation[];
  allocatedMinutes: number;
  remainingMinutes: number;
};

type Candidate = PracticeRecommendation & { priority: number; order: number };

/**
 * Builds a deterministic, evidence-aware practice suggestion.
 *
 * This is a planning read model only: it never writes learner records,
 * completes lessons, or changes skill mastery.
 */
export function buildPracticePlan(input: {
  minutes: number;
  preset?: PracticePlanPreset;
  currentLesson: PracticeLesson | null;
  dueReviews: PracticeReview[];
  now: number;
}): PracticePlan {
  const minutes = Math.floor(input.minutes);
  if (!Number.isFinite(minutes) || minutes < 5 || minutes > 180) {
    throw new RangeError('Practice duration must be between 5 and 180 minutes.');
  }

  const preset: PracticePlanPreset = input.preset ?? (minutes === 10 ? 10 : minutes === 20 ? 20 : minutes === 40 ? 40 : 'custom');
  const scale = minutes < 15 ? 'short' : minutes < 30 ? 'standard' : 'extended';
  const candidates: Candidate[] = [];
  let order = 0;

  const add = (task: Omit<Candidate, 'priority' | 'order'>, priority: number) => {
    candidates.push({ ...task, priority, order: order++ });
  };

  const warmupMinutes = scale === 'short' ? 2 : scale === 'standard' ? 3 : Math.min(5, Math.round(minutes * 0.125));
  add({
    id: 'warm-up',
    kind: 'warm-up',
    title: 'Settle in and warm up',
    minutes: warmupMinutes,
    reason: 'A brief, comfortable warm-up helps you check posture, relaxed movement and clean tone before focused work.'
  }, 70);

  if (input.currentLesson) {
    const lessonMinutes = scale === 'short' ? 5 : scale === 'standard' ? 8 : Math.min(12, Math.round(minutes * 0.3));
    add({
      id: `lesson:${input.currentLesson.id}`,
      kind: 'lesson-focus',
      title: `Work on: ${input.currentLesson.title}`,
      minutes: lessonMinutes,
      reason: input.currentLesson.isInProgress
        ? `You have already started this lesson, so continuing it is the clearest next curriculum step: ${input.currentLesson.focus}.`
        : `This is your next lesson in the learning route. Focus on ${input.currentLesson.focus} without rushing to mark it complete.`,
      lessonId: input.currentLesson.id
    }, input.currentLesson.isInProgress ? 100 : 95);
  }

  const dueReviews = input.dueReviews
    .filter((review) => review.nextReviewAt <= input.now)
    .slice()
    .sort((a, b) => {
      const statePriority = (state: string) => state === 'review_due' ? 0 : state === 'practising' ? 1 : 2;
      return statePriority(a.state) - statePriority(b.state)
        || (a.confidence ?? 50) - (b.confidence ?? 50)
        || a.nextReviewAt - b.nextReviewAt
        || a.skillId.localeCompare(b.skillId);
    });

  dueReviews.forEach((review, index) => {
    const reviewMinutes = scale === 'short' ? 3 : scale === 'standard' ? 4 : 5;
    const confidenceReason = review.confidence === null
      ? 'No confidence rating is recorded yet.'
      : `Your latest confidence rating was ${review.confidence}/100.`;
    add({
      id: `review:${review.skillId}`,
      kind: 'skill-review',
      title: `Revisit ${formatSkillName(review.skillId)}`,
      minutes: reviewMinutes,
      reason: `This skill is due for spaced review. ${confidenceReason} Revisit it before adding more new material.`,
      skillId: review.skillId
    }, 110 - index);
  });

  if (input.currentLesson) {
    const applicationMinutes = scale === 'short' ? 4 : scale === 'standard' ? 4 : Math.min(10, Math.round(minutes * 0.25));
    add({
      id: `apply:${input.currentLesson.id}`,
      kind: 'musical-application',
      title: 'Use the idea in a short musical phrase',
      minutes: applicationMinutes,
      reason: `Applying ${input.currentLesson.focus} in a musical context helps connect the exercise to real playing.`,
      lessonId: input.currentLesson.id
    }, 60);
  }

  add({
    id: 'reflection',
    kind: 'reflection',
    title: 'Notice one thing to keep and one thing to revisit',
    minutes: 1,
    reason: 'A short reflection records what felt reliable and what deserves another look next time.'
  }, 10);

  // Higher-value tasks are selected first. The final list is restored to a
  // learner-friendly order; tasks that do not fit are omitted, never squeezed.
  const selected: Candidate[] = [];
  let remaining = minutes;
  for (const candidate of candidates.slice().sort((a, b) => b.priority - a.priority || a.order - b.order)) {
    if (candidate.minutes <= remaining) {
      selected.push(candidate);
      remaining -= candidate.minutes;
    }
  }
  selected.sort((a, b) => a.order - b.order);

  return {
    minutes,
    preset,
    recommendations: selected.map((task) => ({
      id: task.id,
      kind: task.kind,
      title: task.title,
      minutes: task.minutes,
      reason: task.reason,
      ...(task.skillId ? { skillId: task.skillId } : {}),
      ...(task.lessonId ? { lessonId: task.lessonId } : {})
    })),
    allocatedMinutes: minutes - remaining,
    remainingMinutes: remaining
  };
}

function formatSkillName(skillId: string): string {
  return skillId.split(/[.-]/).filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}
