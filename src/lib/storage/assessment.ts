import { recordAssessmentAttempt } from '../application/services';
import {
  ACTIVE_CURRICULUM_RELEASE_ID,
  listCurriculumSkills
} from '../application/skill-catalog';
import {
  scoreStandardTuningAssessment,
  standardTuningAssessment,
  type StandardTuningAnswers
} from '../domain/learning/standard-tuning-assessment';
import type {
  AssessmentAttemptRecord,
  CurriculumLessonRecord,
  CurriculumRepository,
  SkillRepository
} from '../repositories/contracts';
import { systemRuntime } from '../repositories/contracts';
import year1Lessons from '../../../content/curriculum/year-1-lessons.json';
import {
  createIndexedDbRepositories,
  ensureActiveLearnerProfile,
  openLocalDatabase
} from './indexeddb';

/**
 * Score and append one learner's standard-tuning recall attempt. The assessment
 * is authored for the active curriculum release and uses the existing
 * append-only assessmentAttempts store; no separate or cloud record is created.
 */
export async function recordActiveStandardTuningAssessment(
  answers: StandardTuningAnswers
): Promise<AssessmentAttemptRecord> {
  if (
    standardTuningAssessment.curriculumReleaseId !==
    ACTIVE_CURRICULUM_RELEASE_ID
  ) {
    throw new Error(
      'The standard-tuning assessment does not match the active curriculum release.'
    );
  }

  const scored = scoreStandardTuningAssessment(answers);
  const lesson = year1Lessons.lessons.find(
    (candidate) => candidate.id === standardTuningAssessment.lessonId
  );
  if (!lesson) {
    throw new Error('The authored lesson for this assessment is unavailable.');
  }

  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);

    const curriculum: Pick<CurriculumRepository, 'findLesson'> = {
      findLesson: async (releaseId, lessonId) => {
        if (
          releaseId !== ACTIVE_CURRICULUM_RELEASE_ID ||
          lessonId !== lesson.id
        ) {
          return null;
        }
        const record: CurriculumLessonRecord = {
          releaseId,
          lessonId: lesson.id,
          curriculumId: lesson.curriculumId,
          curriculumWeekId: lesson.curriculumWeekId,
          week: lesson.week,
          route: lesson.route,
          title: lesson.title,
          focus: lesson.focus,
          estimatedMinutes: lesson.estimatedMinutes
        };
        return record;
      }
    };
    const skills: Pick<SkillRepository, 'findForRelease'> = {
      findForRelease: async (releaseId, skillId) => {
        if (releaseId !== ACTIVE_CURRICULUM_RELEASE_ID) return null;
        return (
          listCurriculumSkills().find((skill) => skill.id === skillId) ?? null
        );
      }
    };

    return await recordAssessmentAttempt(
      {
        learnerId: profile.id,
        submission: {
          curriculumReleaseId: ACTIVE_CURRICULUM_RELEASE_ID,
          skillId: standardTuningAssessment.skillId,
          lessonId: standardTuningAssessment.lessonId,
          assessmentKind: 'measured',
          evidenceType: 'measured',
          outcome: scored.outcome,
          score: scored.score,
          evidenceSummary:
            scored.score === null
              ? 'The response was incomplete; no percentage score was assigned.'
              : `${scored.correctCount} of ${scored.totalItems} standard open-string pitches were identified correctly.`,
          evidence: {
            source: 'learner-selected-pitch-options',
            scoringRuleVersion: standardTuningAssessment.scoringRuleVersion,
            correctItems: scored.correctCount,
            answeredItems: scored.answeredCount,
            totalItems: scored.totalItems
          },
          assessmentInstrument: scored.assessmentInstrument,
          itemEvidence: scored.itemEvidence
        }
      },
      {
        curriculum,
        skills,
        assessments: repositories.assessments,
        runtime: systemRuntime
      }
    );
  } finally {
    database.close();
  }
}


/** Load the most recent saved attempt for this authored assessment, if any. */
export async function loadLatestActiveStandardTuningAssessment(): Promise<AssessmentAttemptRecord | null> {
  const database = await openLocalDatabase();
  try {
    const profile = await ensureActiveLearnerProfile(database);
    const repositories = createIndexedDbRepositories(database);
    const attempts = await repositories.assessments.listBySkill(
      profile.id,
      ACTIVE_CURRICULUM_RELEASE_ID,
      standardTuningAssessment.skillId
    );
    return (
      attempts
        .filter(
          (attempt) =>
            attempt.assessmentInstrument?.definitionId ===
            standardTuningAssessment.definitionId
        )
        .sort(
          (left, right) =>
            right.assessedAt - left.assessedAt ||
            right.recordedAt - left.recordedAt ||
            right.id.localeCompare(left.id)
        )[0] ?? null
    );
  } finally {
    database.close();
  }
}
