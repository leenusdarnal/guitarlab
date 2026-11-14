import { describe, expect, it } from 'vitest';
import { practiceEvidenceInputSchema } from './practice-evidence';

const validEvidence = {
  id: '1d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a11',
  learnerId: '2d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a12',
  sessionId: '3d3b7a3e-7a5e-4a63-9e6b-0c4e9f2d8a13',
  exerciseId: 'alternate-picking-eighth-notes',
  repetitions: 20,
  cleanRepetitions: 16,
  tempoBpm: 80,
  difficulty: 3,
  recordedAt: 1_800_000_000_000
};

describe('practice evidence contract', () => {
  it('accepts a valid exercise observation without inferring mastery', () => {
    expect(practiceEvidenceInputSchema.parse(validEvidence)).toEqual(
      validEvidence
    );
  });

  it('allows zero repetitions and unknown tempo or difficulty', () => {
    expect(
      practiceEvidenceInputSchema.parse({
        ...validEvidence,
        repetitions: 0,
        cleanRepetitions: 0,
        tempoBpm: null,
        difficulty: null
      })
    ).toMatchObject({
      repetitions: 0,
      cleanRepetitions: 0,
      tempoBpm: null,
      difficulty: null
    });
  });

  it('rejects more clean repetitions than total repetitions', () => {
    expect(
      practiceEvidenceInputSchema.safeParse({
        ...validEvidence,
        cleanRepetitions: 21
      }).success
    ).toBe(false);
  });

  it('rejects out-of-range tempo, difficulty and negative counts', () => {
    for (const patch of [
      { tempoBpm: 0 },
      { tempoBpm: 301 },
      { difficulty: 0 },
      { difficulty: 6 },
      { repetitions: -1 }
    ]) {
      expect(
        practiceEvidenceInputSchema.safeParse({
          ...validEvidence,
          ...patch
        }).success
      ).toBe(false);
    }
  });

  it('accepts complete authored identity on persisted observations', () => {
    expect(
      practiceEvidenceInputSchema.parse({
        ...validEvidence,
        curriculumReleaseId: 'curriculum-v1.0.6',
        lessonId: 'y1-w01-lesson',
        authoredExerciseId: 'y1-w01-lesson-focus',
        practiceTaxonomyVersion: '0.1.0'
      })
    ).toMatchObject({
      curriculumReleaseId: 'curriculum-v1.0.6',
      lessonId: 'y1-w01-lesson',
      authoredExerciseId: 'y1-w01-lesson-focus',
      practiceTaxonomyVersion: '0.1.0'
    });
  });

  it('keeps legacy observations unlinked and rejects partial authored identity', () => {
    expect(practiceEvidenceInputSchema.parse(validEvidence)).toEqual(
      validEvidence
    );
    expect(
      practiceEvidenceInputSchema.safeParse({
        ...validEvidence,
        curriculumReleaseId: 'curriculum-v1.0.6',
        lessonId: 'y1-w01-lesson'
      }).success
    ).toBe(false);
  });

  it('rejects unknown fields so arbitrary payloads are not persisted', () => {
    expect(
      practiceEvidenceInputSchema.safeParse({
        ...validEvidence,
        mastery: 'mastered'
      }).success
    ).toBe(false);
  });
});
