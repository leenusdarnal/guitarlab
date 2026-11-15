import { describe, expect, it } from 'vitest';
import { createTheoryRecallExercise } from './theory-recall';

describe('theory recall exercises', () => {
  it('connects the chord name to its scale-degree position', () => {
    const exercise = createTheoryRecallExercise('name');
    expect(exercise.answer).toBe('f_major');
    expect(exercise.tones).toEqual([]);
    expect(exercise.choices.map((choice) => choice.value)).toEqual([
      'f_major',
      'g_major',
      'a_minor'
    ]);
    expect(exercise.explanation).toContain('F, A and C');
  });

  it('plays deterministic major and minor triads for sound recognition', () => {
    const major = createTheoryRecallExercise('sound', 0);
    const minor = createTheoryRecallExercise('sound', 1);
    expect(major.answer).toBe('major');
    expect(minor.answer).toBe('minor');
    expect(major.tones).toHaveLength(3);
    expect(minor.tones).toHaveLength(3);
    expect(major.tones.map((tone) => tone.frequencyHz)).toEqual(
      [60, 64, 67].map((midi) => 440 * 2 ** ((midi - 69) / 12))
    );
    expect(minor.tones.map((tone) => tone.frequencyHz)).toEqual(
      [57, 60, 64].map((midi) => 440 * 2 ** ((midi - 69) / 12))
    );
    expect(major.tones.map((tone) => tone.startMilliseconds)).toEqual([
      0, 0, 0
    ]);
  });

  it('connects dominant function to a musical use', () => {
    const exercise = createTheoryRecallExercise('use');
    expect(exercise.answer).toBe('g_major');
    expect(exercise.tones).toEqual([]);
    expect(exercise.explanation).toContain('leading tone, B');
  });

  it('rejects invalid sequence values and unsupported exercise kinds', () => {
    expect(() => createTheoryRecallExercise('sound', -1)).toThrow(RangeError);
    expect(() => createTheoryRecallExercise('name', 1.5)).toThrow(RangeError);
    expect(() => createTheoryRecallExercise('recall' as never)).toThrow(
      RangeError
    );
  });
});
