import { describe, expect, it } from 'vitest';
import { createEarTrainingExercise } from './ear-training';

describe('ear-training exercise model', () => {
  it('creates a steady pulse with equal beat spacing', () => {
    const exercise = createEarTrainingExercise('pulse');
    expect(exercise.answer).toBe('steady');
    expect(exercise.tones.map((tone) => tone.startMilliseconds)).toEqual([
      0, 500, 1_000, 1_500
    ]);
    expect(exercise.choices.map((choice) => choice.value)).toEqual([
      'steady',
      'uneven'
    ]);
  });

  it('creates an uneven pulse with distinguishable gaps', () => {
    const exercise = createEarTrainingExercise('pulse', 1);
    expect(exercise.answer).toBe('uneven');
    expect(exercise.tones.map((tone) => tone.startMilliseconds)).toEqual([
      0, 340, 1_040, 1_380
    ]);
  });

  it('alternates which pitch is higher without changing the response labels', () => {
    const first = createEarTrainingExercise('pitch', 0);
    const second = createEarTrainingExercise('pitch', 1);
    expect(first.answer).toBe('first');
    expect(first.tones[0].frequencyHz).toBeGreaterThan(
      first.tones[1].frequencyHz
    );
    expect(second.answer).toBe('second');
    expect(second.tones[1].frequencyHz).toBeGreaterThan(
      second.tones[0].frequencyHz
    );
  });

  it('creates rising, falling and level melodic contours', () => {
    const rising = createEarTrainingExercise('contour', 0);
    const falling = createEarTrainingExercise('contour', 1);
    const level = createEarTrainingExercise('contour', 2);
    expect(rising.answer).toBe('rising');
    expect(falling.answer).toBe('falling');
    expect(level.answer).toBe('level');
    expect(rising.tones[0].frequencyHz).toBeLessThan(
      rising.tones[2].frequencyHz
    );
    expect(falling.tones[0].frequencyHz).toBeGreaterThan(
      falling.tones[2].frequencyHz
    );
    expect(new Set(level.tones.map((tone) => tone.frequencyHz)).size).toBe(1);
  });

  it('creates reproducible interval recognition challenges', () => {
    const expected = [
      ['unison', 440],
      ['minor_third', 440 * Math.pow(2, 3 / 12)],
      ['major_third', 440 * Math.pow(2, 4 / 12)],
      ['perfect_fifth', 440 * Math.pow(2, 7 / 12)]
    ] as const;
    expected.forEach(([answer, secondFrequency], sequence) => {
      const exercise = createEarTrainingExercise('interval', sequence);
      expect(exercise.answer).toBe(answer);
      expect(exercise.tones).toHaveLength(2);
      expect(exercise.tones[0].frequencyHz).toBe(440);
      expect(exercise.tones[1].frequencyHz).toBeCloseTo(secondFrequency);
      expect(exercise.choices.map((choice) => choice.value)).toEqual([
        'unison',
        'minor_third',
        'major_third',
        'perfect_fifth'
      ]);
    });
  });

  it('rejects invalid sequence values and unsupported exercise kinds', () => {
    expect(() => createEarTrainingExercise('pulse', -1)).toThrow(RangeError);
    expect(() => createEarTrainingExercise('pitch', 1.5)).toThrow(RangeError);
    expect(() => createEarTrainingExercise('rhythm' as never)).toThrow(
      RangeError
    );
  });
});
