import { describe, expect, it } from 'vitest';
import {
  ACTIVE_CURRICULUM_RELEASE_ID,
  SKILL_CATALOG_VERSION,
  getSkillCategoryDisplayName,
  listCurriculumSkills,
  listSkillsForLessons
} from './skill-catalog';

describe('versioned curriculum skill catalogue', () => {
  it('exposes the current local release and a stable set of canonical skill IDs', () => {
    const skills = listCurriculumSkills();
    expect(ACTIVE_CURRICULUM_RELEASE_ID).toBe('curriculum-v1');
    expect(SKILL_CATALOG_VERSION).toBe('1.0.0');
    expect(skills).toHaveLength(34);
    expect(new Set(skills.map((skill) => skill.id)).size).toBe(34);
    expect(skills).toEqual(
      [...skills].sort((left, right) => left.id.localeCompare(right.id))
    );
  });

  it('limits a learner to skills explicitly attached to reached Year 1 lessons', () => {
    expect(
      listSkillsForLessons(['y1-w01-lesson']).map((skill) => skill.id)
    ).toEqual(['instrument.posture', 'instrument.tuning']);
    expect(listSkillsForLessons(['unknown-lesson'])).toEqual([]);
  });

  it('resolves category labels without inventing unknown categories', () => {
    expect(getSkillCategoryDisplayName('rhythm')).toBe('Rhythm');
    expect(getSkillCategoryDisplayName('future-category')).toBe(
      'future-category'
    );
  });
});
