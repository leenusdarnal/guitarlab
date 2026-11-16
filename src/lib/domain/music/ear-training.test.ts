import { describe, expect, it } from 'vitest';
import {
  createEarTrainingExercise,
  type EarTrainingAnswer
} from './ear-training';

describe('ear-training exercise model', () => {
  it('creates a steady pulse with equal beat spacing', () => {
    const exercise = createEarTrainingExercise('pulse');
    expect(exercise.answer).toBe('steady');
    expect(exercise.tones.map((tone) => tone.startMilliseconds)).toEqual([
      0, 500, 1_000, 1_500
    ]);
    expect(
      exercise.choices.map((choice) => choice.value).sort()
    ).toEqual(['steady', 'uneven']);
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

  it('creates a three-chord I–IV–I or I–V–I listening sequence', () => {
    const subdominant = createEarTrainingExercise('chord-movement', 0);
    const dominant = createEarTrainingExercise('chord-movement', 1);

    expect(subdominant.answer).toBe('subdominant');
    expect(dominant.answer).toBe('dominant');
    expect(subdominant.tones).toHaveLength(9);
    expect(dominant.tones).toHaveLength(9);
    expect([
      ...new Set(subdominant.tones.map((tone) => tone.startMilliseconds))
    ]).toEqual([0, 900, 1_800]);
    expect(
      subdominant.tones
        .filter((tone) => tone.startMilliseconds === 0)
        .map((tone) => tone.frequencyHz)
        .sort((left, right) => left - right)
    ).toEqual(
      [60, 64, 67]
        .map((midi) => 440 * 2 ** ((midi - 69) / 12))
        .sort((left, right) => left - right)
    );
    const middleSubdominant = subdominant.tones
      .filter((tone) => tone.startMilliseconds === 900)
      .map((tone) => tone.frequencyHz)
      .sort((left, right) => left - right);
    const middleDominant = dominant.tones
      .filter((tone) => tone.startMilliseconds === 900)
      .map((tone) => tone.frequencyHz)
      .sort((left, right) => left - right);
    expect(middleSubdominant).toEqual(
      [65, 69, 72]
        .map((midi) => 440 * 2 ** ((midi - 69) / 12))
        .sort((left, right) => left - right)
    );
    expect(middleDominant).toEqual(
      [67, 71, 74]
        .map((midi) => 440 * 2 ** ((midi - 69) / 12))
        .sort((left, right) => left - right)
    );
    expect(
      subdominant.choices.map((choice) => choice.value).sort()
    ).toEqual(['dominant', 'subdominant']);
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

  it('varies the correct answer position while keeping option sets reproducible', () => {
    const factories = [
      (sequence: number) => createEarTrainingExercise('pulse', sequence),
      (sequence: number) => createEarTrainingExercise('pitch', sequence),
      (sequence: number) => createEarTrainingExercise('contour', sequence),
      (sequence: number) => createEarTrainingExercise('chord-movement', sequence),
      (sequence: number) => createEarTrainingExercise('interval', sequence),
      (sequence: number) =>
        createEarTrainingExercise('interval', sequence, 'steps-and-tritone'),
      (sequence: number) =>
        createEarTrainingExercise('interval', sequence, 'wide-leaps')
    ];

    for (const createExercise of factories) {
      const exercises = Array.from({ length: 100 }, (_, sequence) =>
        createExercise(sequence)
      );
      const optionCount = exercises[0].choices.length;
      const expectedOptions = exercises[0].choices
        .map((choice) => choice.value)
        .sort();
      const answerPositions = new Set<number>();

      exercises.forEach((exercise, sequence) => {
        const repeated = createExercise(sequence);
        const position = exercise.choices.findIndex(
          (choice) => choice.value === exercise.answer
        );
        answerPositions.add(position);

        expect(position).toBeGreaterThanOrEqual(0);
        expect(
          exercise.choices.map((choice) => choice.value).sort()
        ).toEqual(expectedOptions);
        expect(repeated.choices).toEqual(exercise.choices);
        expect(repeated.answer).toBe(exercise.answer);
      });

      expect(answerPositions.size).toBe(optionCount);
    }
  });

  it('creates reproducible interval recognition challenges', () => {
    const expected = [
      ['unison', 0],
      ['minor_third', 3],
      ['major_third', 4],
      ['perfect_fifth', 7]
    ] as const;
    expected.forEach(([answer, semitones], sequence) => {
      const exercise = createEarTrainingExercise('interval', sequence);
      expect(exercise.answer).toBe(answer);
      expect(exercise.tones).toHaveLength(2);
      expect(
        12 *
          Math.log2(
            exercise.tones[1].frequencyHz / exercise.tones[0].frequencyHz
          )
      ).toBeCloseTo(semitones);
      expect(
        exercise.choices.map((choice) => choice.value).sort()
      ).toEqual([
        'major_third',
        'minor_third',
        'perfect_fifth',
        'unison'
      ]);
    });
  });

  it('covers the added step and tritone intervals in their own practice set', () => {
    const expected = [
      ['minor_second', 1],
      ['major_second', 2],
      ['perfect_fourth', 5],
      ['tritone', 6]
    ] as const;

    expected.forEach(([answer, semitones], sequence) => {
      const exercise = createEarTrainingExercise(
        'interval',
        sequence,
        'steps-and-tritone'
      );
      expect(exercise.answer).toBe(answer);
      expect(
        12 *
          Math.log2(
            exercise.tones[1].frequencyHz / exercise.tones[0].frequencyHz
          )
      ).toBeCloseTo(semitones);
      expect(exercise.choices).toHaveLength(4);
    });
  });

  it('covers sixths, sevenths and octave in the wide-leaps set', () => {
    const expected = [
      ['minor_sixth', 8],
      ['major_sixth', 9],
      ['minor_seventh', 10],
      ['major_seventh', 11],
      ['octave', 12]
    ] as const;

    expected.forEach(([answer, semitones], sequence) => {
      const exercise = createEarTrainingExercise(
        'interval',
        sequence,
        'wide-leaps'
      );
      expect(exercise.answer).toBe(answer);
      expect(
        12 *
          Math.log2(
            exercise.tones[1].frequencyHz / exercise.tones[0].frequencyHz
          )
      ).toBeCloseTo(semitones);
      expect(exercise.choices).toHaveLength(5);
    });
  });

  it('cycles each interval through every bounded chromatic root deterministically', () => {
    const semitonesByAnswer: Partial<Record<EarTrainingAnswer, number>> = {
      unison: 0,
      minor_second: 1,
      major_second: 2,
      minor_third: 3,
      major_third: 4,
      perfect_fourth: 5,
      tritone: 6,
      perfect_fifth: 7,
      minor_sixth: 8,
      major_sixth: 9,
      minor_seventh: 10,
      major_seventh: 11,
      octave: 12
    };
    const intervalCounts = {
      foundation: 4,
      'steps-and-tritone': 4,
      'wide-leaps': 5
    } as const;
    const midiToFrequency = (midiNote: number) =>
      440 * 2 ** ((midiNote - 69) / 12);
    const midiFromFrequency = (frequencyHz: number) =>
      Math.round(69 + 12 * Math.log2(frequencyHz / 440));

    for (const intervalSet of Object.keys(intervalCounts) as Array<
      keyof typeof intervalCounts
    >) {
      const intervalCount = intervalCounts[intervalSet];
      const rootStride = intervalCount === 4 ? 5 : 7;
      const exerciseCount = intervalCount * 24;
      const exercises = Array.from({ length: exerciseCount }, (_, sequence) =>
        createEarTrainingExercise('interval', sequence, intervalSet)
      );
      const replay = Array.from({ length: exerciseCount }, (_, sequence) =>
        createEarTrainingExercise('interval', sequence, intervalSet)
      );
      const rootMidiNotes = exercises.map((exercise) =>
        midiFromFrequency(exercise.tones[0].frequencyHz)
      );
      const generatedFrequencies = exercises.flatMap((exercise) =>
        exercise.tones.map((tone) => tone.frequencyHz)
      );
      const rootsByInterval = new Map<EarTrainingAnswer, number[]>();

      exercises.forEach((exercise, sequence) => {
        const semitones = semitonesByAnswer[exercise.answer];
        const intervalPosition = sequence % intervalCount;
        const intervalCycle = Math.floor(sequence / intervalCount);
        const expectedRoot =
          48 + ((intervalPosition + intervalCycle * rootStride) % 24);
        expect(semitones).toBeDefined();
        expect(rootMidiNotes[sequence]).toBe(expectedRoot);
        expect(
          12 *
            Math.log2(
              exercise.tones[1].frequencyHz / exercise.tones[0].frequencyHz
            )
        ).toBeCloseTo(semitones ?? -1);

        const roots = rootsByInterval.get(exercise.answer) ?? [];
        roots.push(rootMidiNotes[sequence]);
        rootsByInterval.set(exercise.answer, roots);
      });

      expect(rootsByInterval.size).toBe(intervalCount);
      for (const roots of rootsByInterval.values()) {
        expect(roots).toHaveLength(24);
        expect(new Set(roots).size).toBe(24);
        expect(new Set(roots.map((midiNote) => midiNote % 12)).size).toBe(12);
        expect(Math.max(...roots) - Math.min(...roots)).toBe(23);
      }

      expect(Math.min(...generatedFrequencies)).toBeGreaterThanOrEqual(
        midiToFrequency(48)
      );
      expect(Math.max(...generatedFrequencies)).toBeLessThanOrEqual(
        midiToFrequency(83)
      );
      expect(
        exercises.map((exercise) =>
          exercise.tones.map((tone) => tone.frequencyHz)
        )
      ).toEqual(
        replay.map((exercise) => exercise.tones.map((tone) => tone.frequencyHz))
      );
    }
  });
  it('rejects invalid sequence values and unsupported exercise kinds', () => {
    expect(() => createEarTrainingExercise('pulse', -1)).toThrow(RangeError);
    expect(() => createEarTrainingExercise('pitch', 1.5)).toThrow(RangeError);
    expect(() =>
      createEarTrainingExercise('interval', 0, 'unsupported' as never)
    ).toThrow(RangeError);
    expect(() => createEarTrainingExercise('rhythm' as never)).toThrow(
      RangeError
    );
  });
});
