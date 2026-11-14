import { describe, expect, it } from 'vitest';
import { createEarTrainingExercise } from '../music/ear-training';
import type { EarTrainingAnswer } from '../music/ear-training';
import {
  intervalRecognitionAssessment,
  pulseRecognitionAssessment,
  scoreIntervalRecognitionResponse,
  scorePulseRecognitionResponse
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

describe('pulse recognition assessment evidence', () => {
  it('uses a versioned supporting-probe instrument for auditory rhythm recognition', () => {
    expect(pulseRecognitionAssessment).toEqual({
      definitionId: 'guitar.ear-training.pulse-recognition',
      definitionVersion: 1,
      scoringRuleVersion: 'exact-pulse-pattern-choice-v1',
      skillId: 'ear.rhythm',
      decisionScope: 'supporting_probe'
    });
  });

  it('records stable item identities for both authored four-beat patterns', () => {
    const steadyExercise = createEarTrainingExercise('pulse', 0);
    const steady = scorePulseRecognitionResponse(steadyExercise, 'steady');
    expect(steady).toMatchObject({
      score: 100,
      outcome: 'passed',
      assessmentInstrument: {
        itemCount: 1,
        passThreshold: 100,
        decisionScope: 'supporting_probe'
      },
      itemEvidence: [
        {
          itemId: 'pulse-recognition.equal-500ms-gaps',
          response: 'steady',
          outcome: 'correct',
          responseSource: 'learner_selected_option'
        }
      ]
    });

    const unevenExercise = createEarTrainingExercise('pulse', 1);
    const uneven = scorePulseRecognitionResponse(unevenExercise, 'uneven');
    expect(uneven.itemEvidence[0]).toMatchObject({
      itemId: 'pulse-recognition.alternating-340-700ms-gaps',
      response: 'uneven',
      outcome: 'correct'
    });
  });

  it('records an incorrect choice without inferring a performance error or confusion code', () => {
    const exercise = createEarTrainingExercise('pulse', 0);
    const result = scorePulseRecognitionResponse(exercise, 'uneven');
    expect(result).toMatchObject({
      score: 0,
      outcome: 'needs_practice',
      itemEvidence: [
        {
          itemId: 'pulse-recognition.equal-500ms-gaps',
          response: 'uneven',
          outcome: 'incorrect'
        }
      ]
    });
    expect(result.itemEvidence[0]).not.toHaveProperty('confusionCode');
  });

  it('rejects non-pulse exercises and answers outside the item choices', () => {
    expect(() =>
      scorePulseRecognitionResponse(
        createEarTrainingExercise('interval', 0),
        'steady'
      )
    ).toThrow('Only pulse-recognition exercises');
    expect(() =>
      scorePulseRecognitionResponse(
        createEarTrainingExercise('pulse', 0),
        'rising'
      )
    ).toThrow('not valid for this pulse item');
    const invalidKey = {
      ...createEarTrainingExercise('pulse', 0),
      answer: 'rising' as EarTrainingAnswer
    };
    expect(() => scorePulseRecognitionResponse(invalidKey, 'steady')).toThrow(
      'The pulse item does not have an authored answer.'
    );
  });
});
