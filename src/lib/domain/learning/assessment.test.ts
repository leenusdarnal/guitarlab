import { describe, expect, it } from 'vitest';
import { assessmentAttemptInputSchema } from './assessment';

const valid = {
  id: '8e35fc81-dc90-4fe7-9c5e-93a84170f0e1',
  learnerId: '6d1a32df-2cbd-4930-b594-32ed2f8a44e2',
  curriculumReleaseId: 'curriculum-v1',
  skillId: 'instrument.tuning',
  lessonId: 'y1-w01-lesson',
  assessmentKind: 'checkpoint',
  evidenceType: 'observed_or_self_checked',
  outcome: 'needs_practice',
  score: null,
  evidenceSummary: 'The learner identified five of six strings correctly.',
  evidence: { correctItems: 5, totalItems: 6 },
  assessedAt: 1794355200000
} as const;

const objectiveEvidence = {
  assessmentInstrument: {
    definitionId: 'guitar.standard-tuning-open-pitches',
    definitionVersion: 1,
    scoringRuleVersion: 'exact-pitch-five-of-six-v1',
        decisionScope: 'supporting_probe'
  },
  itemEvidence: [
    {
      itemId: 'standard-tuning.string-6-open-pitch',
      response: 'E2',
      outcome: 'correct',
      responseSource: 'learner_selected_option'
    },
    {
      itemId: 'standard-tuning.string-5-open-pitch',
      response: 'A2',
      outcome: 'correct',
      responseSource: 'learner_selected_option'
    },
    {
      itemId: 'standard-tuning.string-4-open-pitch',
      response: null,
      outcome: 'inconclusive',
      responseSource: 'no_response'
    }
  ]
} as const;

describe('assessment attempt validation', () => {
  it('accepts bounded structured evidence and legacy skill-level attempts', () => {
    expect(assessmentAttemptInputSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts versioned item outcomes with explicit response provenance', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        outcome: 'inconclusive',
        score: null,
        ...objectiveEvidence
      }).success
    ).toBe(true);
  });

  it('requires instrument provenance whenever item evidence is present', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        itemEvidence: objectiveEvidence.itemEvidence
      }).success
    ).toBe(false);
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        assessmentInstrument: objectiveEvidence.assessmentInstrument
      }).success
    ).toBe(false);
  });

  it('rejects duplicate item IDs and mismatched no-response provenance', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        outcome: 'passed',
        score: 100,
        assessmentInstrument: objectiveEvidence.assessmentInstrument,
        itemEvidence: [
          objectiveEvidence.itemEvidence[0],
          objectiveEvidence.itemEvidence[0]
        ]
      }).success
    ).toBe(false);
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        assessmentInstrument: objectiveEvidence.assessmentInstrument,
        itemEvidence: [
          {
            itemId: 'standard-tuning.string-6-open-pitch',
            response: null,
            outcome: 'correct',
            responseSource: 'no_response'
          }
        ]
      }).success
    ).toBe(false);
  });

  it('rejects scored attempt outcomes when one or more item results are inconclusive', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        outcome: 'passed',
        score: 100,
        ...objectiveEvidence
      }).success
    ).toBe(false);
  });

  it('rejects out-of-range scores', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({ ...valid, score: 101 }).success
    ).toBe(false);
  });

  it('rejects evidence values that could contain private media or oversized payloads', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        evidence: { recording: 'x'.repeat(161) }
      }).success
    ).toBe(false);
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        evidence: Object.fromEntries(
          Array.from({ length: 31 }, (_, index) => [`field${index}`, index])
        )
      }).success
    ).toBe(false);
  });

  it('rejects unbounded private media fields', () => {
    expect(
      assessmentAttemptInputSchema.safeParse({
        ...valid,
        recordingBlob: 'base64-audio-data'
      }).success
    ).toBe(false);
  });
});
