import { describe, expect, it } from 'vitest';
import {
  createEmptySongProject,
  songProjectRecordSchema
} from './song-project';

const learnerId = '8b34e7a9-9e4e-4ba6-8e16-1b497c7d4c01';

describe('local song project contract', () => {
  it('creates a blank local project without bundled or copied media', () => {
    expect(
      createEmptySongProject({
        id: '123e4567-e89b-42d3-a456-426614174000',
        learnerId,
        title: 'My arrangement',
        now: 100
      })
    ).toMatchObject({
      learnerId,
      title: 'My arrangement',
      sourceType: 'original',
      sourceUrl: null,
      notes: '',
      sections: [],
      createdAt: 100,
      updatedAt: 100
    });
  });

  it('accepts section notes, an external bookmark and a learner practice target', () => {
    const project = createEmptySongProject({
      id: '123e4567-e89b-42d3-a456-426614174000',
      learnerId,
      title: 'Study project',
      now: 100
    });
    project.sections.push({
      id: '223e4567-e89b-42d3-a456-426614174000',
      title: 'Verse',
      order: 0,
      notes: 'Keep the bass note steady.',
      bookmark: 'Reference link at 0:42',
      practiceTarget: 'Play the change four times without pausing.'
    });
    expect(songProjectRecordSchema.parse(project).sections[0]).toMatchObject({
      title: 'Verse',
      bookmark: 'Reference link at 0:42',
      practiceTarget: 'Play the change four times without pausing.'
    });
  });

  it('requires an external URL for link-only projects and rejects unsafe schemes', () => {
    const project = createEmptySongProject({
      id: '123e4567-e89b-42d3-a456-426614174000',
      learnerId,
      title: 'Reference',
      now: 100
    });
    expect(
      songProjectRecordSchema.safeParse({
        ...project,
        sourceType: 'reference_link'
      }).success
    ).toBe(false);
    expect(
      songProjectRecordSchema.safeParse({
        ...project,
        sourceUrl: 'javascript:alert(1)'
      }).success
    ).toBe(false);
  });

  it('rejects duplicate section ids and duplicate ordering positions', () => {
    const project = createEmptySongProject({
      id: '123e4567-e89b-42d3-a456-426614174000',
      learnerId,
      title: 'Study project',
      now: 100
    });
    const section = {
      id: '223e4567-e89b-42d3-a456-426614174000',
      title: 'Verse',
      order: 0,
      notes: '',
      bookmark: null,
      practiceTarget: null
    };
    expect(
      songProjectRecordSchema.safeParse({
        ...project,
        sections: [section, { ...section, title: 'Chorus', order: 1 }]
      }).success
    ).toBe(false);
    expect(
      songProjectRecordSchema.safeParse({
        ...project,
        sections: [
          section,
          { ...section, id: '323e4567-e89b-42d3-a456-426614174000' }
        ]
      }).success
    ).toBe(false);
  });
});
