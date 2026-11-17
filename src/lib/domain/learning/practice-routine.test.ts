import { describe, expect, it } from 'vitest';
import {
  createPracticeRoutineSnapshot,
  practiceRoutineSchema,
  practiceRoutineSnapshotSchema
} from './practice-routine';

const routine = {
  id: '11111111-1111-4111-8111-111111111111',
  name: 'Balanced daily practice',
  focus: 'Steady fundamentals',
  exercises: [
    {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Warm-up and relaxed fretting',
      minutes: 5
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      name: 'Chord changes with a metronome',
      minutes: 10
    }
  ],
  createdAt: 100,
  updatedAt: 100
};

describe('saved practice routines', () => {
  it('validates and normalizes a named ordered exercise sequence', () => {
    expect(
      practiceRoutineSchema.parse({
        ...routine,
        name: '  Balanced daily practice  ',
        exercises: [
          { ...routine.exercises[0], name: ' Warm-up and relaxed fretting ' },
          routine.exercises[1]
        ]
      })
    ).toMatchObject({
      name: 'Balanced daily practice',
      exercises: [
        { name: 'Warm-up and relaxed fretting' },
        { name: 'Chord changes with a metronome' }
      ]
    });
  });

  it('requires a useful 5–180 minute plan with one to twelve exercises', () => {
    expect(
      practiceRoutineSchema.safeParse({
        ...routine,
        exercises: [{ ...routine.exercises[0], minutes: 4 }]
      }).success
    ).toBe(false);
    expect(
      practiceRoutineSchema.safeParse({
        ...routine,
        exercises: [{ ...routine.exercises[0], minutes: 181 }]
      }).success
    ).toBe(false);
    expect(
      practiceRoutineSchema.safeParse({
        ...routine,
        exercises: Array.from({ length: 13 }, (_, index) => ({
          ...routine.exercises[0],
          id: `22222222-2222-4222-8222-${String(index + 1).padStart(12, '0')}`,
          minutes: 5
        }))
      }).success
    ).toBe(false);
  });

  it('rejects duplicate exercise identifiers and invalid names', () => {
    expect(
      practiceRoutineSchema.safeParse({
        ...routine,
        exercises: [
          routine.exercises[0],
          { ...routine.exercises[1], id: routine.exercises[0].id }
        ]
      }).success
    ).toBe(false);
    expect(
      practiceRoutineSchema.safeParse({
        ...routine,
        exercises: [{ ...routine.exercises[0], name: '  ' }]
      }).success
    ).toBe(false);
  });

  it('freezes the exercise order and time allocations for a started session', () => {
    const snapshot = createPracticeRoutineSnapshot(routine);
    routine.exercises.reverse();
    routine.exercises[0].minutes = 20;

    expect(snapshot.exercises.map((exercise) => exercise.name)).toEqual([
      'Warm-up and relaxed fretting',
      'Chord changes with a metronome'
    ]);
    expect(snapshot.exercises.map((exercise) => exercise.minutes)).toEqual([
      5, 10
    ]);
    expect(practiceRoutineSnapshotSchema.parse(snapshot)).toEqual(snapshot);
  });
});
