import { describe, expect, it } from 'vitest';
import { buildPracticePlan } from './practice-plan';

const lesson = {
  id: 'year-1-week-1',
  title: 'Meet your guitar',
  focus: 'posture and instrument setup',
  estimatedMinutes: 30,
  isInProgress: false
};

describe('explainable practice planning', () => {
  it.each([10, 20, 40])('fits a %i-minute plan without exceeding the budget', (minutes) => {
    const plan = buildPracticePlan({
      minutes,
      currentLesson: lesson,
      dueReviews: [],
      now: 1_000
    });
    expect(plan.allocatedMinutes).toBeLessThanOrEqual(minutes);
    expect(plan.remainingMinutes).toBeGreaterThanOrEqual(0);
    expect(plan.recommendations.every((task) => task.minutes > 0)).toBe(true);
    expect(plan.recommendations.every((task) => task.reason.length > 20)).toBe(true);
  });

  it('uses a smaller set of focused tasks for a short plan', () => {
    const plan = buildPracticePlan({
      minutes: 10,
      currentLesson: lesson,
      dueReviews: [],
      now: 1_000
    });
    expect(plan.recommendations.map((task) => task.kind)).toEqual([
      'warm-up',
      'lesson-focus',
      'reflection'
    ]);
    expect(plan.recommendations.some((task) => task.kind === 'musical-application')).toBe(false);
  });

  it('prioritises due reviews and explains why they are included', () => {
    const plan = buildPracticePlan({
      minutes: 20,
      currentLesson: lesson,
      dueReviews: [
        { skillId: 'rhythm.pulse', state: 'practising', confidence: 65, nextReviewAt: 900 },
        { skillId: 'fretting.clean-tone', state: 'review_due', confidence: 35, nextReviewAt: 800 },
        { skillId: 'ear.intervals', state: 'stable', confidence: 90, nextReviewAt: 2_000 }
      ],
      now: 1_000
    });
    const review = plan.recommendations.find((task) => task.skillId === 'fretting.clean-tone');
    expect(review).toBeDefined();
    expect(review?.reason).toContain('35/100');
    expect(plan.recommendations.some((task) => task.skillId === 'ear.intervals')).toBe(false);
  });

  it('uses a custom duration and allows a learner to override the preset', () => {
    const plan = buildPracticePlan({
      minutes: 15,
      preset: 'custom',
      currentLesson: lesson,
      dueReviews: [],
      now: 1_000
    });
    expect(plan.preset).toBe('custom');
    expect(plan.minutes).toBe(15);
  });

  it('handles missing lesson and review evidence without inventing progress', () => {
    const plan = buildPracticePlan({
      minutes: 10,
      currentLesson: null,
      dueReviews: [],
      now: 1_000
    });
    expect(plan.recommendations.map((task) => task.kind)).toEqual(['warm-up', 'reflection']);
    expect(plan.recommendations.some((task) => task.kind === 'lesson-focus')).toBe(false);
    expect(plan.recommendations.some((task) => task.kind === 'skill-review')).toBe(false);
  });

  it('rejects durations outside the supported range', () => {
    expect(() => buildPracticePlan({
      minutes: 4,
      currentLesson: lesson,
      dueReviews: [],
      now: 1_000
    })).toThrow(RangeError);
  });
});
