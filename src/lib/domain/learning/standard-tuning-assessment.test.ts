import { describe, expect, it } from 'vitest';
import {
  scoreStandardTuningAssessment,
  standardTuningAssessment
} from './standard-tuning-assessment';

const correctAnswers = {
  'standard-tuning.string-6-open-pitch': 'E2',
  'standard-tuning.string-5-open-pitch': 'A2',
  'standard-tuning.string-4-open-pitch': 'D3',
  'standard-tuning.string-3-open-pitch': 'G3',
  'standard-tuning.string-2-open-pitch': 'B3',
  'standard-tuning.string-1-open-pitch': 'E4'
} as const;

describe('standard tuning assessment', () => {
  it('uses stable item IDs and the expected six standard open pitches', () => {
    expect(standardTuningAssessment.items.map((item) => item.id)).toEqual([
      'standard-tuning.string-6-open-pitch',
      'standard-tuning.string-5-open-pitch',
      'standard-tuning.string-4-open-pitch',
      'standard-tuning.string-3-open-pitch',
      'standard-tuning.string-2-open-pitch',
      'standard-tuning.string-1-open-pitch'
    ]);
    expect(standardTuningAssessment.items.map((item) => item.correctAnswer)).toEqual([
      'E2', 'A2', 'D3', 'G3', 'B3', 'E4'
    ]);
  });

  it('scores a complete six-item response and preserves item provenance', () => {
    const result = scoreStandardTuningAssessment(correctAnswers);
    expect(result).toMatchObject({
      correctCount: 6,
      answeredCount: 6,
      totalItems: 6,
      score: 100,
      outcome: 'passed',
      assessmentInstrument: {
        definitionId: 'guitar.standard-tuning-open-pitches',
        definitionVersion: 1,
        scoringRuleVersion: 'exact-pitch-five-of-six-v1',
        decisionScope: 'supporting_probe'
      }
    });
    expect(result.itemEvidence.every(
      (item) => item.outcome === 'correct' && item.responseSource === 'learner_selected_option'
    )).toBe(true);
  });

  it('requires five of six correct for a pass and does not infer mastery', () => {
    const result = scoreStandardTuningAssessment({
      ...correctAnswers,
      'standard-tuning.string-1-open-pitch': 'E2'
    });
    expect(result).toMatchObject({
      correctCount: 5,
      score: 83,
      outcome: 'passed'
    });
  });

  it('records a below-threshold result as needs_practice', () => {
    const result = scoreStandardTuningAssessment({
      'standard-tuning.string-6-open-pitch': 'A2',
      'standard-tuning.string-5-open-pitch': 'E2',
      'standard-tuning.string-4-open-pitch': 'G3',
      'standard-tuning.string-3-open-pitch': 'D3',
      'standard-tuning.string-2-open-pitch': 'E4',
      'standard-tuning.string-1-open-pitch': 'B3'
    });
    expect(result).toMatchObject({
      correctCount: 0,
      score: 0,
      outcome: 'needs_practice'
    });
    expect(result.itemEvidence.every((item) => item.outcome === 'incorrect')).toBe(true);
  });

  it('keeps missing responses inconclusive and score unavailable', () => {
    const result = scoreStandardTuningAssessment({
      'standard-tuning.string-6-open-pitch': 'E2'
    });
    expect(result).toMatchObject({
      answeredCount: 1,
      correctCount: 1,
      score: null,
      outcome: 'inconclusive'
    });
    expect(result.itemEvidence[1]).toMatchObject({
      response: null,
      outcome: 'inconclusive',
      responseSource: 'no_response'
    });
  });

  it('rejects unknown item IDs and answers outside the authored options', () => {
    expect(() =>
      scoreStandardTuningAssessment({ 'unknown-item': 'E2' } as never)
    ).toThrow('unknown item identifier');
    expect(() =>
      scoreStandardTuningAssessment({
        'standard-tuning.string-6-open-pitch': 'C#4'
      } as never)
    ).toThrow('not one of the authored options');
  });
});
