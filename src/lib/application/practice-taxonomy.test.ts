import { describe, expect, it } from 'vitest';
import {
  getAuthoredPracticeScope,
  listAuthoredPracticeScopes,
  PRACTICE_TAXONOMY_RELEASE_ID,
  PRACTICE_TAXONOMY_VERSION
} from './practice-taxonomy';

describe('versioned authored exercise practice taxonomy', () => {
  it('is scoped to the active curriculum release and exposes a small reviewed first slice', () => {
    expect(PRACTICE_TAXONOMY_RELEASE_ID).toBe('curriculum-v1.0.6');
    expect(PRACTICE_TAXONOMY_VERSION).toBe('0.1.0');
    expect(listAuthoredPracticeScopes()).toHaveLength(10);
  });

  it('returns explicit string and fret scope only where the exercise states it', () => {
    expect(
      getAuthoredPracticeScope('y1-w11-lesson', 'y1-w11-lesson-focus')
    ).toMatchObject({
      topicIds: ['fretboard.natural-note-landmarks'],
      stringNumbers: [5, 6],
      fretRange: { minFret: 0, maxFret: 5 }
    });
    expect(
      getAuthoredPracticeScope('y1-w26-lesson', 'y1-w26-lesson-focus')
    ).toMatchObject({ stringNumbers: [1, 2, 3] });
    expect(
      getAuthoredPracticeScope('y1-w03-lesson', 'y1-w03-lesson-focus')
    ).toMatchObject({ stringNumbers: [], fretPositionIds: [] });
  });

  it('keeps technique tags separate from topic and string metadata', () => {
    expect(
      getAuthoredPracticeScope('y1-w15-lesson', 'y1-w15-lesson-focus')
    ).toMatchObject({
      topicIds: [],
      techniqueIds: [
        'technique.alternate-picking',
        'technique.string-crossing'
      ],
      stringNumbers: []
    });
  });

  it('returns no scope for generic or unknown exercise IDs instead of guessing', () => {
    expect(
      getAuthoredPracticeScope('y1-w01-lesson', 'y1-w01-lesson-orient')
    ).toBeNull();
    expect(getAuthoredPracticeScope('unknown-lesson', 'unknown-exercise')).toBeNull();
  });
});
