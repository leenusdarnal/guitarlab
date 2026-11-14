import { describe, expect, it } from 'vitest';
import { createEarTrainingExercise } from '../music/ear-training';
import {
  intervalRecognitionAssessment,
  scoreIntervalRecognitionResponse
} from './ear-training-assessment';

describe('interval recognition assessment evidence', () => {
  it('uses a versioned supporting-probe instrument for the interval skill', () => {
    expect(intervalRecognitionAssessment).toEqual({
      definitionId: 'guitar.ear-training.interval-recognition',
      definitionVersion: 1,
      scoringRuleVersion: 'exact-interval-choice-v1',
      skillId: 'ear.intervals',
      decisionScope: 'supporting_probe'
    });
  });

  it('records an exact correct item outcome with stable target identity', () => {
    const exercise = createEarTrainingExercise('interval', 2);
    const result = scoreIntervalRecognitionResponse(exercise, exercise.answer);
    expect(result).toMatchObject({
      score: 100,
      outcome: 'passed',
      assessmentInstrument: {
        itemCount: 1,
        passThreshold: 100,
        decisionScope: 'supporting_probe'
      },
      itemEvidence: [
        {
          itemId: 'interval-recognition.major_third',
          response: 'major_third',
          outcome: 'correct',
          responseSource: 'learner_selected_option'
        }
      ]
    });
  });

  it('records an incorrect selection without inventing a confusion code', () => {
    const exercise = createEarTrainingExercise('interval', 2);
    const result = scoreIntervalRecognitionResponse(exercise, 'unison');
    expect(result).toMatchObject({
      score: 0,
      outcome: 'needs_practice',
      itemEvidence: [
        {
          itemId: 'interval-recognition.major_third',
          response: 'unison',
          outcome: 'incorrect'
        }
      ]
    });
    expect(result.itemEvidence[0]).not.toHaveProperty('confusionCode');
  });

  it('rejects non-interval exercises and answers outside the item choices', () => {
    expect(() =>
      scoreIntervalRecognitionResponse(
        createEarTrainingExercise('pulse', 0),
        'steady'
      )
    ).toThrow('Only interval-recognition exercises');
    expect(() =>
      scoreIntervalRecognitionResponse(
        createEarTrainingExercise('interval', 0),
        'rising'
      )
    ).toThrow('not valid for this interval item');
  });
});
