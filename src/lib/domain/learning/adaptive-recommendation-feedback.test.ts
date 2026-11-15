import { describe, expect, it } from 'vitest';
import { adaptiveRecommendationFeedbackSchema } from './adaptive-recommendation-feedback';

const base = {
  id: '00000000-0000-4000-8000-000000000010',
  learnerId: '00000000-0000-4000-8000-000000000001',
  curriculumReleaseId: 'curriculum-v1.0.6',
  recommendationId: 'skill:rhythm.pulse',
  targetType: 'skill' as const,
  targetId: 'rhythm.pulse',
  reasonCodes: ['assessment_needs_practice'],
  action: 'dismiss' as const,
  correction: null,
  createdAt: 200
};

describe('adaptive recommendation feedback schema', () => {
  it('accepts a bounded dismissal record', () => {
    expect(adaptiveRecommendationFeedbackSchema.parse(base)).toEqual(base);
  });

  it('requires a correction reason for correction actions', () => {
    expect(
      adaptiveRecommendationFeedbackSchema.safeParse({
        ...base,
        action: 'correct',
        correction: null
      }).success
    ).toBe(false);
    expect(
      adaptiveRecommendationFeedbackSchema.safeParse({
        ...base,
        action: 'correct',
        correction: 'too_difficult'
      }).success
    ).toBe(true);
  });

  it('accepts an explicitly evidenced repeated-item recommendation reason', () => {
    const record = {
      ...base,
      reasonCodes: ['not_yet_assessed', 'repeated_item_incorrect']
    };
    expect(adaptiveRecommendationFeedbackSchema.parse(record)).toEqual(record);
  });

  it('rejects mismatched recommendation identity and unknown reason codes', () => {
    expect(
      adaptiveRecommendationFeedbackSchema.safeParse({
        ...base,
        recommendationId: 'exercise:another-id'
      }).success
    ).toBe(false);
    expect(
      adaptiveRecommendationFeedbackSchema.safeParse({
        ...base,
        reasonCodes: ['guessed_accuracy']
      }).success
    ).toBe(false);
  });
});
