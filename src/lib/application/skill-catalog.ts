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

export type SkillLessonLink = {
  id: string;
  week: number;
  title: string;
  focus: string;
};

/** Resolve only lessons explicitly linked to a canonical skill in the curriculum index. */
export function listLessonsForSkill(skillId: string): SkillLessonLink[] {
  return year1DashboardIndex.lessons
    .filter((lesson) => (lesson.skillIds ?? []).includes(skillId))
    .map((lesson) => ({
      id: lesson.id,
      week: lesson.week,
      title: lesson.title,
      focus: lesson.focus
    }))
    .sort((left, right) => left.week - right.week);
}

/** Read the published catalogue description for a known skill. */
export function getSkillDescription(skillId: string): string | null {
  return skillCatalog.skills.find((skill) => skill.id === skillId)?.description ?? null;
}

export function getSkillCategoryDisplayName(categoryId: string): string {
  return (
    skillCatalog.categories.find((category) => category.id === categoryId)
      ?.displayName ?? categoryId
  );
}
