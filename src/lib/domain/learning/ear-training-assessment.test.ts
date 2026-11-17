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
      definitionVersion: 3,
      scoringRuleVersion: 'exact-interval-choice-v3',
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

  it('records new interval classes as version-3 supporting-probe items', () => {
    const cases = [
      ['steps-and-tritone', 0, 'minor_second'],
      ['steps-and-tritone', 3, 'tritone'],
      ['wide-leaps', 0, 'minor_sixth'],
      ['wide-leaps', 4, 'octave']
    ] as const;

    for (const [set, sequence, answer] of cases) {
      const exercise = createEarTrainingExercise('interval', sequence, set);
      const result = scoreIntervalRecognitionResponse(exercise, answer);
      expect(result.assessmentInstrument).toMatchObject({
        definitionId: 'guitar.ear-training.interval-recognition',
        definitionVersion: 3,
        scoringRuleVersion: 'exact-interval-choice-v3',
        decisionScope: 'supporting_probe'
      });
      expect(result.itemEvidence[0]).toMatchObject({
        itemId: `interval-recognition.${answer}`,
        response: answer,
        outcome: 'correct'
      });
      expect(result.itemEvidence[0]).not.toHaveProperty('confusionCode');
    }
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


describe('chord movement recognition assessment evidence', () => {
  it('uses a versioned supporting-probe instrument without claiming playing mastery', async () => {
    const { chordMovementRecognitionAssessment } = await import('./ear-training-assessment');
    expect(chordMovementRecognitionAssessment).toEqual({
      definitionId: 'guitar.ear-training.chord-movement-recognition',
      definitionVersion: 1,
      scoringRuleVersion: 'exact-chord-function-choice-v1',
      skillId: 'harmony.triads',
      decisionScope: 'supporting_probe'
    });
  });

  it('records stable IV and V progression item identities and explicit responses', async () => {
    const { scoreChordMovementResponse } = await import('./ear-training-assessment');
    for (const [sequence, answer] of [[0, 'subdominant'], [1, 'dominant']] as const) {
      const exercise = createEarTrainingExercise('chord-movement', sequence);
      const result = scoreChordMovementResponse(exercise, answer);
      expect(result).toMatchObject({
        score: 100,
        outcome: 'passed',
        assessmentInstrument: {
          definitionId: 'guitar.ear-training.chord-movement-recognition',
          definitionVersion: 1,
          scoringRuleVersion: 'exact-chord-function-choice-v1',
          itemCount: 1,
          passThreshold: 100,
          decisionScope: 'supporting_probe'
        },
        itemEvidence: [{
          itemId: `chord-movement.${answer}-between-tonic`,
          response: answer,
          outcome: 'correct',
          responseSource: 'learner_selected_option'
        }]
      });
    }
  });

  it('records an incorrect choice without inventing a confusion diagnosis', async () => {
    const { scoreChordMovementResponse } = await import('./ear-training-assessment');
    const exercise = createEarTrainingExercise('chord-movement', 0);
    const result = scoreChordMovementResponse(exercise, 'dominant');
    expect(result).toMatchObject({
      score: 0,
      outcome: 'needs_practice',
      itemEvidence: [{
        itemId: 'chord-movement.subdominant-between-tonic',
        response: 'dominant',
        outcome: 'incorrect'
      }]
    });
    expect(result.itemEvidence[0]).not.toHaveProperty('confusionCode');
  });

  it('rejects a non-chord exercise, invalid response, and unauthored answer', async () => {
    const { scoreChordMovementResponse } = await import('./ear-training-assessment');
    expect(() => scoreChordMovementResponse(createEarTrainingExercise('pulse'), 'steady')).toThrow(
      'Only chord-movement exercises'
    );
    expect(() => scoreChordMovementResponse(createEarTrainingExercise('chord-movement'), 'rising')).toThrow(
      'not valid for this chord-movement item'
    );
    const invalid = { ...createEarTrainingExercise('chord-movement'), answer: 'rising' as EarTrainingAnswer };
    expect(() => scoreChordMovementResponse(invalid, 'subdominant')).toThrow(
      'does not have an authored answer'
    );
  });
});
