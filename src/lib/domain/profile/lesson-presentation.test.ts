import { describe, expect, it } from 'vitest';
import {
  getLessonPresentationSectionOrder,
  getLessonPresentationSectionSequence,
  lessonPresentationOptions,
  lessonPresentationSectionIds,
  resolveLessonPresentation
} from './lesson-presentation';

describe('profile-based lesson presentation', () => {
  it('uses a balanced sequence when the learner has not selected a format', () => {
    expect(resolveLessonPresentation(null)).toBe('balanced');
    expect(getLessonPresentationSectionSequence(null)).toEqual(
      getLessonPresentationSectionSequence('balanced')
    );
  });

  it.each(lessonPresentationOptions)(
    'keeps every authored section available for $value',
    ({ value }) => {
      const sequence = getLessonPresentationSectionSequence(value);

      expect(sequence).toHaveLength(lessonPresentationSectionIds.length);
      expect(new Set(sequence).size).toBe(lessonPresentationSectionIds.length);
      expect(new Set(sequence)).toEqual(new Set(lessonPresentationSectionIds));

      for (const section of lessonPresentationSectionIds) {
        expect(
          getLessonPresentationSectionOrder(value, section)
        ).toBeGreaterThan(0);
      }
    }
  );

  it('changes the section order without changing section identity', () => {
    expect(
      getLessonPresentationSectionOrder('visual-first', 'demonstration')
    ).toBeLessThan(
      getLessonPresentationSectionOrder('visual-first', 'key-idea')
    );
    expect(
      getLessonPresentationSectionOrder('interactive-first', 'exercises')
    ).toBeLessThan(
      getLessonPresentationSectionOrder('interactive-first', 'key-idea')
    );
    expect(
      getLessonPresentationSectionOrder('song-first', 'music')
    ).toBeLessThan(getLessonPresentationSectionOrder('song-first', 'key-idea'));
  });

  it('keeps the balanced reader order aligned with the authored sequence', () => {
    expect(getLessonPresentationSectionSequence('balanced')).toEqual(
      lessonPresentationSectionIds
    );
  });
});
