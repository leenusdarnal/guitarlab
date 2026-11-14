import { describe, expect, it } from 'vitest';
import type { AdaptiveRecommendationFeedbackRecord } from '../domain/learning/adaptive-recommendation-feedback';
import {
  createRestorePreview,
  LEARNER_BACKUP_FORMAT,
  LEARNER_BACKUP_VERSION,
  parseLearnerBackup,
  parseLearnerBackupJson,
  type LearnerBackup
} from './backup';

const learnerId = '8b34e7a9-9e4e-4ba6-8e16-1b497c7d4c01';
const progressId = '5c1e2b4f-2a62-4fd5-9eb7-1dc79f86f1a7';

function makeBackup(): LearnerBackup {
  return {
    format: LEARNER_BACKUP_FORMAT,
    version: LEARNER_BACKUP_VERSION,
    exportedAt: 1_800_000_000_000,
    learnerId,
    records: {
      profile: {
        id: learnerId,
        preferencesSchemaVersion: 1,
        preferences: {
          schemaVersion: 1,
          instrument: 'acoustic',
          handedness: null,
          tuning: null,
          startingPoint: 'fresh-beginner',
          goals: ['all-round-musician'],
          practiceMinutes: 20,
          availableDays: [],
          lessonPresentation: null
        },
        createdAt: 1_800_000_000_000,
        updatedAt: 1_800_000_000_000,
        lastActiveAt: null
      },
      lessonProgress: [
        {
          id: progressId,
          learnerId,
          curriculumReleaseId: 'curriculum-v1',
          lessonId: 'year-1-week-1',
          status: 'in_progress',
          lastBlockId: null,
          startedAt: 1_800_000_000_000,
          completedAt: null,
          updatedAt: 1_800_000_000_000
        }
      ],
      completionEvents: [],
      assessmentAttempts: [],
      skillMastery: [],
      practiceSessions: []
    }
  };
}

describe('learner backup contract', () => {
  it('accepts a valid versioned backup and parses JSON text', () => {
    const backup = makeBackup();
    expect(parseLearnerBackup(backup)).toEqual({ success: true, data: backup });
    expect(parseLearnerBackupJson(JSON.stringify(backup))).toEqual({
      success: true,
      data: backup
    });
  });

  it('round-trips M4.2 checkpoint state while accepting older version-1 backups', () => {
    const older = makeBackup();
    expect(parseLearnerBackup(older)).toMatchObject({ success: true });
    const newer = makeBackup();
    newer.records.lessonProgress[0] = {
      ...newer.records.lessonProgress[0],
      lastBlockId: 'guided-demo',
      completedBlockIds: ['guided-demo'],
      checkpointOutcome: 'needs_practice',
      checkpointNote: 'Keep the pulse relaxed.',
      revision: 1
    };
    expect(parseLearnerBackup(newer)).toMatchObject({
      success: true,
      data: {
        records: {
          lessonProgress: [
            {
              completedBlockIds: ['guided-demo'],
              checkpointOutcome: 'needs_practice',
              checkpointNote: 'Keep the pulse relaxed.',
              revision: 1
            }
          ]
        }
      }
    });
  });

  it('accepts appended exercise observations and retains old version-1 backup compatibility', () => {
    const backup = makeBackup();
    expect(parseLearnerBackup(backup)).toMatchObject({ success: true });
    backup.records.practiceSessions.push({
      id: 'b1b1b1b1-1111-4111-8111-111111111111',
      learnerId,
      primaryCurriculumReleaseId: 'curriculum-v1.0.6',
      primaryLessonId: 'y1-w01-lesson',
      primaryExerciseId: 'y1-w01-lesson-focus',
      practiceTaxonomyVersion: '0.1.0',
      status: 'completed',
      activeStartedAt: null,
      plannedMinutes: 20,
      actualDurationSeconds: 300,
      focus: 'Alternate picking',
      difficulty: null,
      reflection: null,
      nextTarget: 'Repeat the scale at 72 BPM.',
      startedAt: 1_800_000_000_000,
      endedAt: 1_800_000_300_000,
      createdAt: 1_800_000_000_000,
      updatedAt: 1_800_000_300_000
    });
    backup.records.practiceEvidence = [
      {
        id: 'c1c1c1c1-1111-4111-8111-111111111111',
        learnerId,
        sessionId: 'b1b1b1b1-1111-4111-8111-111111111111',
        exerciseId: 'alternate-picking-eighth-notes',
        repetitions: 20,
        cleanRepetitions: 15,
        tempoBpm: 80,
        difficulty: 3,
        recordedAt: 1_800_000_200_000,
        curriculumReleaseId: 'curriculum-v1.0.6',
        lessonId: 'y1-w01-lesson',
        authoredExerciseId: 'y1-w01-lesson-focus',
        practiceTaxonomyVersion: '0.1.0'
      }
    ];
    expect(parseLearnerBackup(backup)).toMatchObject({
      success: true,
      data: {
        records: {
          practiceEvidence: [
            {
              repetitions: 20,
              cleanRepetitions: 15,
              lessonId: 'y1-w01-lesson',
              authoredExerciseId: 'y1-w01-lesson-focus',
              practiceTaxonomyVersion: '0.1.0'
            }
          ],
          practiceSessions: [
            {
              nextTarget: 'Repeat the scale at 72 BPM.',
              primaryExerciseId: 'y1-w01-lesson-focus',
              practiceTaxonomyVersion: '0.1.0'
            }
          ]
        }
      }
    });
    const orphaned = structuredClone(backup);
    orphaned.records.practiceEvidence![0].sessionId =
      'd1d1d1d1-1111-4111-8111-111111111111';
    expect(parseLearnerBackup(orphaned)).toMatchObject({
      success: false,
      message: expect.stringContaining('practiceEvidence')
    });

    const mismatchedAuthoredLink = structuredClone(backup);
    mismatchedAuthoredLink.records.practiceEvidence![0].authoredExerciseId = 'another-exercise';
    expect(parseLearnerBackup(mismatchedAuthoredLink)).toMatchObject({
      success: false,
      message: expect.stringContaining('authored practice observation')
    });
  });

  it('keeps learner correction provenance in new backups and accepts legacy mastery rows', () => {
    const legacy = makeBackup();
    legacy.records.skillMastery = [
      {
        learnerId,
        curriculumReleaseId: 'curriculum-v1',
        skillId: 'alternate-picking',
        state: 'learning',
        evidenceCount: 0,
        confidence: null,
        lastAssessmentId: null,
        lastAssessedAt: null,
        nextReviewAt: null,
        updatedAt: 1_800_000_000_000
      }
    ];
    expect(parseLearnerBackup(legacy)).toMatchObject({ success: true });

    const corrected = makeBackup();
    corrected.records.skillMastery = [
      {
        learnerId,
        curriculumReleaseId: 'curriculum-v1',
        skillId: 'alternate-picking',
        state: 'practising',
        evidenceCount: 2,
        confidence: 65,
        lastAssessmentId: null,
        lastAssessedAt: null,
        nextReviewAt: null,
        decisionSource: 'learner',
        correctionNote: 'I can play it slowly but not consistently yet.',
        updatedAt: 1_800_000_000_000
      }
    ];
    const parsed = parseLearnerBackupJson(JSON.stringify(corrected));
    expect(parsed).toMatchObject({
      success: true,
      data: {
        records: {
          skillMastery: [
            {
              decisionSource: 'learner',
              correctionNote: 'I can play it slowly but not consistently yet.'
            }
          ]
        }
      }
    });
  });

  it('round-trips adaptive feedback and preserves version-1 backup compatibility', () => {
    const backup = makeBackup();
    const record: AdaptiveRecommendationFeedbackRecord = {
      id: 'e1e1e1e1-1111-4111-8111-111111111111',
      learnerId,
      curriculumReleaseId: 'curriculum-v1.0.6',
      recommendationId: 'skill:rhythm.pulse',
      targetType: 'skill' as const,
      targetId: 'rhythm.pulse',
      reasonCodes: ['assessment_needs_practice'],
      action: 'correct' as const,
      correction: 'too_difficult' as const,
      createdAt: 300
    };
    backup.records.adaptiveRecommendationFeedback = [record];
    expect(parseLearnerBackupJson(JSON.stringify(backup))).toMatchObject({
      success: true,
      data: { records: { adaptiveRecommendationFeedback: [record] } }
    });

    const legacyBackup = makeBackup();
    expect(parseLearnerBackup(legacyBackup)).toMatchObject({ success: true });

    const foreign = structuredClone(backup);
    foreign.records.adaptiveRecommendationFeedback![0].learnerId =
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    expect(parseLearnerBackup(foreign)).toMatchObject({ success: false });

    const duplicate = structuredClone(backup);
    duplicate.records.adaptiveRecommendationFeedback!.push(record);
    expect(parseLearnerBackup(duplicate)).toMatchObject({
      success: false,
      message: expect.stringContaining('duplicate')
    });
  });

  it('round-trips versioned objective item evidence and accepts legacy assessment rows', () => {
    const backup = makeBackup();
    const attempt = {
      id: 'f2f2f2f2-2222-4222-8222-222222222222',
      learnerId,
      curriculumReleaseId: 'curriculum-v1.0.6',
      skillId: 'instrument.tuning',
      lessonId: 'y1-w01-lesson',
      assessmentKind: 'measured' as const,
      evidenceType: 'measured' as const,
      outcome: 'passed' as const,
      score: 100,
      evidenceSummary:
        'Both open-string pitches in this test fixture were identified correctly.',
      evidence: {
        source: 'learner-selected-pitch-options',
        scoringRuleVersion: 'two-item-round-trip-test-v1',
        correctItems: 2,
        answeredItems: 2,
        totalItems: 2
      },
      assessmentInstrument: {
        definitionId: 'guitar.standard-tuning-open-pitches',
        definitionVersion: 1,
        scoringRuleVersion: 'two-item-round-trip-test-v1',
        itemCount: 2,
        passThreshold: 100,
        decisionScope: 'supporting_probe' as const
      },
      itemEvidence: [
        {
          itemId: 'standard-tuning.string-6-open-pitch',
          response: 'E2',
          outcome: 'correct' as const,
          responseSource: 'learner_selected_option' as const
        },
        {
          itemId: 'standard-tuning.string-5-open-pitch',
          response: 'A2',
          outcome: 'correct' as const,
          responseSource: 'learner_selected_option' as const
        }
      ],
      assessedAt: 1_800_000_100_000,
      recordedAt: 1_800_000_100_000
    };
    backup.records.assessmentAttempts.push(attempt);

    const parsed = parseLearnerBackupJson(JSON.stringify(backup));
    expect(parsed).toMatchObject({
      success: true,
      data: {
        records: {
          assessmentAttempts: [
            {
              assessmentInstrument: {
                definitionId: 'guitar.standard-tuning-open-pitches',
                definitionVersion: 1,
                itemCount: 2,
                passThreshold: 100
              },
              itemEvidence: [
                {
                  itemId: 'standard-tuning.string-6-open-pitch',
                  response: 'E2'
                },
                {
                  itemId: 'standard-tuning.string-5-open-pitch',
                  response: 'A2'
                }
              ]
            }
          ]
        }
      }
    });

    // Existing version-1 backups without itemEvidence remain importable.
    expect(parseLearnerBackup(makeBackup())).toMatchObject({ success: true });
  });

  it('rejects malformed JSON, unsupported versions and oversized files', () => {
    expect(parseLearnerBackupJson('{')).toMatchObject({
      success: false,
      message: 'The selected file is not valid JSON.'
    });
    expect(parseLearnerBackup({ ...makeBackup(), version: 99 })).toMatchObject({
      success: false
    });
    expect(parseLearnerBackupJson('x'.repeat(10_000_001))).toMatchObject({
      success: false,
      message: expect.stringContaining('too large')
    });
  });

  it('rejects mismatched learner ownership and duplicate record IDs', () => {
    const backup = makeBackup();
    const mismatched = {
      ...backup,
      records: {
        ...backup.records,
        lessonProgress: backup.records.lessonProgress.map((record) => ({
          ...record,
          learnerId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
        }))
      }
    };
    expect(parseLearnerBackup(mismatched)).toMatchObject({ success: false });

    const duplicate = makeBackup();
    duplicate.records.lessonProgress.push({
      ...duplicate.records.lessonProgress[0]
    });
    expect(parseLearnerBackup(duplicate)).toMatchObject({
      success: false,
      message: expect.stringContaining('duplicate')
    });
  });

  it('rejects relational orphans before restore can write anything', () => {
    const backup = makeBackup();
    backup.records.completionEvents.push({
      id: '799e5d99-6526-4c04-a9d8-01ac26032c0e',
      progressId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      learnerId,
      curriculumReleaseId: 'curriculum-v1',
      lessonId: 'year-1-week-1',
      completionSource: 'learner_confirmed',
      completedAt: 1_800_000_000_000
    });
    expect(parseLearnerBackup(backup)).toMatchObject({
      success: false,
      message: expect.stringContaining('completionEvents')
    });
  });

  it('previews additions, replacements and removals without mutating datasets', () => {
    const incoming = makeBackup();
    const existing = structuredClone(incoming.records);
    existing.lessonProgress.push({
      id: '0b0be34d-9a98-4b49-86f7-6f2974cde590',
      learnerId,
      curriculumReleaseId: 'curriculum-v1',
      lessonId: 'year-1-week-2',
      status: 'in_progress',
      lastBlockId: null,
      startedAt: 1_800_000_000_000,
      completedAt: null,
      updatedAt: 1_800_000_000_000
    });
    const originalExistingCount = existing.lessonProgress.length;
    const preview = createRestorePreview(incoming, existing);

    expect(preview.records.profile).toEqual({ add: 0, replace: 1, remove: 0 });
    expect(preview.records.lessonProgress).toEqual({
      add: 0,
      replace: 1,
      remove: 1
    });
    expect(preview.totals).toEqual({
      add: 0,
      replace: 2,
      remove: 1
    });
    expect(existing.lessonProgress).toHaveLength(originalExistingCount);
    expect(incoming.records.lessonProgress).toHaveLength(1);
  });

  it('marks a restore that replaces a different active learner profile', () => {
    const incoming = makeBackup();
    const existing = structuredClone(incoming.records);
    existing.profile.id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

    expect(createRestorePreview(incoming, existing).replacesActiveProfile).toBe(
      true
    );
    expect(createRestorePreview(incoming, null).replacesActiveProfile).toBe(
      false
    );
  });
});
