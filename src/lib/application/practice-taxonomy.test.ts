import { describe, expect, it } from 'vitest';
import {
  getAuthoredPracticeScope,
  listAuthoredPracticeDimensions,
  listAuthoredPracticeScopes,
  listAuthoredPracticeScopeSnapshots,
  PRACTICE_TAXONOMY_RELEASE_ID,
  PRACTICE_TAXONOMY_VERSION
} from './practice-taxonomy';

describe('versioned authored exercise practice taxonomy', () => {
  it('is scoped to the active curriculum release and exposes the expanded author-reviewed scope', () => {
    expect(PRACTICE_TAXONOMY_RELEASE_ID).toBe('curriculum-v1.0.6');
    expect(PRACTICE_TAXONOMY_VERSION).toBe('0.3.0');
    expect(listAuthoredPracticeScopes()).toHaveLength(24);
    expect(
      listAuthoredPracticeScopeSnapshots().map((snapshot) => [
        snapshot.version,
        snapshot.scopes.length
      ])
    ).toEqual([
      ['0.1.0', 10],
      ['0.2.0', 15],
      ['0.3.0', 24]
    ]);
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

  it('tags five additional exact exercises only where their instructions support the scope', () => {
    expect(
      getAuthoredPracticeScope('y1-w16-lesson', 'y1-w16-lesson-music')
    ).toMatchObject({
      techniqueIds: ['technique.fingerstyle-thumb-independence'],
      stringNumbers: [6],
      fretPositionIds: []
    });
    expect(
      getAuthoredPracticeScope('y1-w17-lesson', 'y1-w17-lesson-focus')
    ).toMatchObject({
      topicIds: [
        'theory.major-scale-construction',
        'lead.a-minor-pentatonic-note-set'
      ],
      stringNumbers: [],
      fretPositionIds: []
    });
    expect(
      getAuthoredPracticeScope('y1-w37-lesson', 'y1-w37-lesson-focus')
    ).toMatchObject({
      topicIds: ['ear.melody-transcription'],
      stringNumbers: [],
      fretPositionIds: []
    });
    expect(
      getAuthoredPracticeScope('y2-w04-lesson', 'y2-w04-lesson-focus')
    ).toMatchObject({
      topicIds: ['harmony.triad-inversions'],
      stringNumbers: [],
      fretPositionIds: []
    });
    expect(
      getAuthoredPracticeScope('y2-w30-lesson', 'y2-w30-lesson-focus')
    ).toMatchObject({
      topicIds: ['rhythm.groove-transcription'],
      stringNumbers: [],
      fretPositionIds: []
    });
  });

  it('adds nine more exact exercises only where their authored evidence supports the scope', () => {
    expect(
      getAuthoredPracticeScope('y1-w13-lesson', 'y1-w13-lesson-music')
    ).toMatchObject({
      topicIds: ['notation.tab-reading'],
      stringNumbers: [3, 4]
    });
    expect(
      getAuthoredPracticeScope('y1-w45-lesson', 'y1-w45-lesson-music')
    ).toMatchObject({ stringNumbers: [1, 2, 3, 4] });
    expect(
      getAuthoredPracticeScope('y2-w01-lesson', 'y2-w01-lesson-music')
    ).toMatchObject({
      topicIds: ['fretboard.natural-note-landmarks'],
      stringNumbers: [5, 6],
      fretPositionIds: []
    });
    expect(
      getAuthoredPracticeScope(
        'y3-rock-blues-w03-lesson',
        'y3-rock-blues-w03-lesson-focus'
      )
    ).toMatchObject({
      techniqueIds: ['technique.pitch-bending'],
      stringNumbers: [2],
      fretRange: { minFret: 8, maxFret: 10 }
    });
    expect(
      getAuthoredPracticeScope(
        'y3-rock-blues-w04-lesson',
        'y3-rock-blues-w04-lesson-focus'
      )
    ).toMatchObject({
      techniqueIds: [
        'technique.alternate-picking',
        'technique.legato',
        'technique.string-crossing'
      ],
      stringNumbers: [2, 3, 4],
      fretRange: { minFret: 5, maxFret: 7 }
    });
    expect(
      getAuthoredPracticeScope(
        'y3-rock-blues-w08-lesson',
        'y3-rock-blues-w08-lesson-focus'
      )
    ).toMatchObject({
      topicIds: ['lead.a-minor-pentatonic-box-1'],
      stringNumbers: [1, 2, 3, 4, 5, 6],
      fretPositionIds: ['position.pentatonic-box-1'],
      fretRange: { minFret: 5, maxFret: 8 }
    });
    expect(
      getAuthoredPracticeScope(
        'y3-rock-blues-w02-lesson',
        'y3-rock-blues-w02-lesson-focus'
      )
    ).toMatchObject({
      topicIds: ['lead.a-minor-pentatonic-box-1'],
      fretPositionIds: [
        'position.pentatonic-box-1',
        'position.pentatonic-box-2'
      ]
    });
    expect(
      getAuthoredPracticeScope(
        'y3-fingerstyle-acoustic-w02-lesson',
        'y3-fingerstyle-acoustic-w02-lesson-focus'
      )
    ).toMatchObject({
      techniqueIds: ['technique.pima-fingerstyle'],
      stringNumbers: [1, 2, 3, 5],
      fretPositionIds: ['position.open-position'],
      fretRange: { minFret: 0, maxFret: 3 }
    });
    expect(
      getAuthoredPracticeScope(
        'y3-jazz-harmony-w05-lesson',
        'y3-jazz-harmony-w05-lesson-focus'
      )
    ).toMatchObject({
      topicIds: ['harmony.extended-chord-voicings'],
      stringNumbers: [2, 3, 4, 5, 6],
      fretRange: { minFret: 2, maxFret: 5 }
    });
  });

  it('lists only dimensions defined by the active authored taxonomy', () => {
    const dimensions = listAuthoredPracticeDimensions();
    expect(dimensions).toContainEqual({
      category: 'topic',
      id: 'instrument.standard-tuning',
      label: 'Standard tuning'
    });
    expect(dimensions).toContainEqual({
      category: 'string',
      id: '1',
      label: 'High E'
    });
    expect(dimensions).toContainEqual({
      category: 'fret_position',
      id: 'position.open-position',
      label: 'Open position'
    });
    expect(dimensions).toContainEqual({
      category: 'topic',
      id: 'harmony.triad-inversions',
      label: 'Triad inversions'
    });
    expect(dimensions).toContainEqual({
      category: 'technique',
      id: 'technique.fingerstyle-thumb-independence',
      label: 'Fingerstyle thumb independence'
    });
    expect(dimensions).toContainEqual({
      category: 'topic',
      id: 'harmony.extended-chord-voicings',
      label: 'Extended chord voicings'
    });
    expect(dimensions).toContainEqual({
      category: 'technique',
      id: 'technique.pitch-bending',
      label: 'Target-pitch bending'
    });
    expect(dimensions).toContainEqual({
      category: 'technique',
      id: 'technique.pima-fingerstyle',
      label: 'P–I–M–A fingerstyle pattern'
    });
    expect(dimensions).toContainEqual({
      category: 'fret_position',
      id: 'position.pentatonic-box-2',
      label: 'Pentatonic box 2'
    });
    expect(dimensions.some((dimension) => dimension.id === 'free-text')).toBe(
      false
    );
  });

  it('returns no scope for generic or unknown exercise IDs instead of guessing', () => {
    expect(
      getAuthoredPracticeScope('y1-w01-lesson', 'y1-w01-lesson-orient')
    ).toBeNull();
    expect(
      getAuthoredPracticeScope('unknown-lesson', 'unknown-exercise')
    ).toBeNull();
  });
});
