import { explainSkillState } from '../domain/learning/skill-state';
import type { SkillStateExplanation } from '../domain/learning/skill-state';
import type {
  AssessmentAttemptRecord,
  SkillMasteryRecord,
  SkillRecord
} from '../repositories/contracts';

export type SkillProgressOverviewItem = {
  skill: SkillRecord;
  mastery: SkillMasteryRecord | null;
  explanation: SkillStateExplanation;
};

/**
 * Build a complete catalogue view without inventing learner evidence.
 * A skill with no qualifying assessment is explicitly not_started.
 */
export function buildSkillProgressOverview(input: {
  skills: readonly SkillRecord[];
  mastery: readonly SkillMasteryRecord[];
  attempts: readonly AssessmentAttemptRecord[];
  activeReleaseId: string;
  now: number;
}): SkillProgressOverviewItem[] {
  return input.skills.map((skill) => {
    const skillMastery = input.mastery
      .filter((record) => record.skillId === skill.id)
      .sort((left, right) => right.updatedAt - left.updatedAt);
    const mastery =
      skillMastery.find(
        (record) => record.curriculumReleaseId === input.activeReleaseId
      ) ??
      skillMastery[0] ??
      null;

    const skillAttempts = input.attempts
      .filter((attempt) => attempt.skillId === skill.id)
      .sort(
        (left, right) =>
          right.assessedAt - left.assessedAt ||
          right.recordedAt - left.recordedAt ||
          right.id.localeCompare(left.id)
      );
    const releaseId =
      mastery?.curriculumReleaseId ??
      skillAttempts[0]?.curriculumReleaseId ??
      input.activeReleaseId;
    const attempts = skillAttempts.filter(
      (attempt) => attempt.curriculumReleaseId === releaseId
    );

    return {
      skill,
      mastery,
      explanation: explainSkillState({
        attempts,
        current: mastery?.curriculumReleaseId === releaseId ? mastery : null,
        now: input.now
      })
    };
  });
}
