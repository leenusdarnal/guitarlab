import skillCatalog from '../../../content/curriculum/skill-catalog.json';
import year1DashboardIndex from '../../../content/curriculum/year-1-dashboard-index.json';
import type { SkillRecord } from '../repositories/contracts';

/** Existing local assessment and mastery rows use this release key. */
export const ACTIVE_CURRICULUM_RELEASE_ID = skillCatalog.curriculumReleaseId;
export const SKILL_CATALOG_VERSION = skillCatalog.version;

/** Return the catalogue's canonical skill metadata in stable ID order. */
export function listCurriculumSkills(): SkillRecord[] {
  return skillCatalog.skills
    .map((skill) => ({
      id: skill.id,
      category: skill.category,
      displayName: skill.displayName
    }))
    .sort((left, right) => left.id.localeCompare(right.id));
}

/**
 * Limit recommendations to skills explicitly attached to Year 1 lessons
 * already reached by the learner (including the next lesson).
 */
export function listSkillsForLessons(
  lessonIds: readonly string[]
): SkillRecord[] {
  const selectedLessons = new Set(lessonIds);
  const introducedSkillIds = new Set(
    year1DashboardIndex.lessons
      .filter((lesson) => selectedLessons.has(lesson.id))
      .flatMap((lesson) => lesson.skillIds ?? [])
  );

  return listCurriculumSkills().filter((skill) =>
    introducedSkillIds.has(skill.id)
  );
}

export function getSkillCategoryDisplayName(categoryId: string): string {
  return (
    skillCatalog.categories.find((category) => category.id === categoryId)
      ?.displayName ?? categoryId
  );
}
