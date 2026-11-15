import { describe, expect, it } from 'vitest';
import { buildAdaptivePracticeSnapshot } from './adaptive-practice';
import type {
  AssessmentAttemptRecord,
  SkillRecord
} from '../repositories/contracts';

const learnerId = '00000000-0000-4000-8000-000000000001';
const intervalAnswers = [
  'unison',
  'minor_second',
  'major_second',
  'minor_third',
  'major_third',
  'perfect_fourth',
  'tritone',
  'perfect_fifth',
  'minor_sixth',
  'major_sixth',
  'minor_seventh',
  'major_seventh',
  'octave'
] as const;

const skills: SkillRecord[] = [
  { id: 'ear.intervals', category: 'ear', displayName: 'Intervals' }
];

type Instrument = {
  definitionVersion: number;
  scoringRuleVersion: string;
  decisionScope?: 'skill_level' | 'supporting_probe';
};

function intervalAttempt(input: {
  id: string;
  itemId: string;
  response: string | null;
  outcome: 'correct' | 'incorrect' | 'inconclusive';
  assessedAt: number;
  instrument?: Instrument;
  responseSource?: 'learner_selected_option' | 'no_response';
}): AssessmentAttemptRecord {
  const instrument = input.instrument ?? {
    definitionVersion: 2,
    scoringRuleVersion: 'exact-interval-choice-v2'
  };
  return {
    id: input.id,
    learnerId,
    curriculumReleaseId: 'curriculum-v1',
    skillId: 'ear.intervals',
    lessonId: null,
    assessmentKind: 'measured',
    evidenceType: 'measured',
    outcome:
      input.outcome === 'correct'
        ? 'passed'
        : input.outcome === 'incorrect'
          ? 'needs_practice'
          : 'inconclusive',
    score:
      input.outcome === 'correct'
        ? 100
        : input.outcome === 'incorrect'
          ? 0
          : null,
    evidenceSummary: null,
    evidence: {},
    assessedAt: input.assessedAt,
    recordedAt: input.assessedAt,
    assessmentInstrument: {
      definitionId: 'guitar.ear-training.interval-recognition',
      definitionVersion: instrument.definitionVersion,
      scoringRuleVersion: instrument.scoringRuleVersion,
      itemCount: 1,
      passThreshold: 100,
      decisionScope: instrument.decisionScope ?? 'supporting_probe'
    },
    itemEvidence: [
      {
        itemId: input.itemId,
        response: input.response,
        outcome: input.outcome,
        responseSource:
          input.responseSource ??
          (input.response === null ? 'no_response' : 'learner_selected_option')
      }
    ]
  };
}

function itemAnalytics(attempts: readonly AssessmentAttemptRecord[]) {
  const snapshot = buildAdaptivePracticeSnapshot({
    learnerId,
    curriculumReleaseId: 'curriculum-v1',
    skills,
    attempts,
    mastery: [],
    practiceEvidence: [],
    now: 10_000
  });
  return (
    snapshot.skillAnalytics.find((item) => item.skillId === 'ear.intervals')
      ?.itemEvidenceGroups ?? []
  );
}

describe('versioned interval response contrasts', () => {
  it('surfaces all 13 expected intervals and all 12 wrong choices separately for v2 and v3', () => {
    const attempts = ([2, 3] as const).flatMap((version) =>
      intervalAnswers.flatMap((expectedResponse, expectedIndex) =>
        intervalAnswers
          .filter((selectedResponse) => selectedResponse !== expectedResponse)
          .map((selectedResponse, selectedIndex) =>
            intervalAttempt({
              id: `v${version}-${expectedResponse}-${selectedResponse}`,
              itemId: `interval-recognition.${expectedResponse}`,
              response: selectedResponse,
              outcome: 'incorrect',
              assessedAt: version * 10_000 + expectedIndex * 12 + selectedIndex,
              instrument: {
                definitionVersion: version,
                scoringRuleVersion: `exact-interval-choice-v${version}`
              }
            })
          )
      )
    );

    const groups = itemAnalytics(attempts);
    expect(
      groups.map(
        ({ definitionVersion, scoringRuleVersion, assessmentAttemptCount }) => [
          definitionVersion,
          scoringRuleVersion,
          assessmentAttemptCount
        ]
      )
    ).toEqual([
      [2, 'exact-interval-choice-v2', 156],
      [3, 'exact-interval-choice-v3', 156]
    ]);

    for (const group of groups) {
      expect(group.items).toHaveLength(13);
      for (const item of group.items) {
        const expectedResponse = item.itemId.replace(
          'interval-recognition.',
          ''
        );
        const expectedSelectedResponses = intervalAnswers
          .filter((response) => response !== expectedResponse)
          .sort((left, right) => left.localeCompare(right));
        expect(item.attemptCount).toBe(12);
        expect(item.responseMismatches).toEqual(
          expectedSelectedResponses.map((selectedResponse) => ({
            code: `interval.${expectedResponse}.selected.${selectedResponse}`,
            expectedResponse,
            selectedResponse,
            count: 1,
            latestEvidenceAt: expect.any(Number)
          }))
        );
      }
    }
  });

  it('keeps no-response, inconclusive, correct and non-comparable instruments out of contrasts', () => {
    const attempts = [
      intervalAttempt({
        id: 'no-response',
        itemId: 'interval-recognition.minor_second',
        response: null,
        outcome: 'inconclusive',
        assessedAt: 100
      }),
      intervalAttempt({
        id: 'correct-response',
        itemId: 'interval-recognition.minor_second',
        response: 'minor_second',
        outcome: 'correct',
        assessedAt: 200
      }),
      intervalAttempt({
        id: 'mismatched-version-rule',
        itemId: 'interval-recognition.major_second',
        response: 'minor_second',
        outcome: 'incorrect',
        assessedAt: 300,
        instrument: {
          definitionVersion: 2,
          scoringRuleVersion: 'exact-interval-choice-v3'
        }
      }),
      intervalAttempt({
        id: 'unsupported-version',
        itemId: 'interval-recognition.major_second',
        response: 'minor_second',
        outcome: 'incorrect',
        assessedAt: 400,
        instrument: {
          definitionVersion: 4,
          scoringRuleVersion: 'exact-interval-choice-v4'
        }
      }),
      intervalAttempt({
        id: 'skill-level-instrument',
        itemId: 'interval-recognition.major_second',
        response: 'minor_second',
        outcome: 'incorrect',
        assessedAt: 500,
        instrument: {
          definitionVersion: 2,
          scoringRuleVersion: 'exact-interval-choice-v2',
          decisionScope: 'skill_level'
        }
      }),
      intervalAttempt({
        id: 'invalid-selected-answer',
        itemId: 'interval-recognition.major_second',
        response: 'absolute_pitch_guess',
        outcome: 'incorrect',
        assessedAt: 600
      })
    ];

    const groups = itemAnalytics(attempts);
    expect(
      groups.every((group) =>
        group.items.every((item) => item.responseMismatches.length === 0)
      )
    ).toBe(true);
  });

  it('retains the original four-item v1 mapping and does not infer v1 from v2 item IDs', () => {
    const attempts = [
      intervalAttempt({
        id: 'legacy-v1-hyphen-id',
        itemId: 'interval-recognition.perfect-fifth',
        response: 'minor_third',
        outcome: 'incorrect',
        assessedAt: 100,
        instrument: {
          definitionVersion: 1,
          scoringRuleVersion: 'exact-interval-choice-v1'
        }
      }),
      intervalAttempt({
        id: 'legacy-v1-underscore-id',
        itemId: 'interval-recognition.perfect_fifth',
        response: 'minor_third',
        outcome: 'incorrect',
        assessedAt: 200,
        instrument: {
          definitionVersion: 1,
          scoringRuleVersion: 'exact-interval-choice-v1'
        }
      })
    ];

    const groups = itemAnalytics(attempts);
    expect(groups).toHaveLength(1);
    const legacyItem = groups[0].items.find(
      (item) => item.itemId === 'interval-recognition.perfect-fifth'
    );
    const unsupportedItem = groups[0].items.find(
      (item) => item.itemId === 'interval-recognition.perfect_fifth'
    );
    expect(legacyItem?.responseMismatches).toEqual([
      {
        code: 'interval.perfect_fifth.selected.minor_third',
        expectedResponse: 'perfect_fifth',
        selectedResponse: 'minor_third',
        count: 1,
        latestEvidenceAt: 100
      }
    ]);
    expect(unsupportedItem?.responseMismatches).toEqual([]);
  });
});
