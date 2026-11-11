import { describe, expect, it } from 'vitest';
import { getTableConfig } from 'drizzle-orm/sqlite-core';
import {
  curriculumLessons,
  curriculumReleaseSkills,
  curriculumReleases,
  learnerProfiles,
  lessonCompletionEvents,
  lessonProgress,
  practiceSessions,
  skillAssessmentAttempts,
  skillMastery,
  skills
} from './schema';

describe('GuitarLab D1 relational contract', () => {
  it('keeps curriculum versions and lesson metadata versioned', () => {
    expect(getTableConfig(curriculumReleases).name).toBe('curriculum_releases');
    expect(getTableConfig(curriculumLessons).primaryKeys).toHaveLength(1);
    expect(getTableConfig(curriculumLessons).foreignKeys).toHaveLength(1);
  });

  it('uses a release-to-skill join so assessment evidence is version-specific', () => {
    expect(getTableConfig(skills).name).toBe('skills');
    expect(getTableConfig(curriculumReleaseSkills).primaryKeys).toHaveLength(1);
    expect(getTableConfig(skillAssessmentAttempts).foreignKeys.length).toBeGreaterThanOrEqual(3);
  });

  it('keeps lesson content progress and lesson completion events distinct from mastery', () => {
    expect(getTableConfig(lessonProgress).name).toBe('lesson_progress');
    expect(getTableConfig(lessonCompletionEvents).name).toBe('lesson_completion_events');
    expect(getTableConfig(skillMastery).name).toBe('skill_mastery');
    expect(getTableConfig(lessonCompletionEvents).indexes).toHaveLength(1);
  });

  it('records assessment attempts as evidence and mastery as a separate snapshot', () => {
    const attemptConfig = getTableConfig(skillAssessmentAttempts);
    const masteryConfig = getTableConfig(skillMastery);

    expect(attemptConfig.columns.map((column) => column.name)).toContain('outcome');
    expect(attemptConfig.columns.map((column) => column.name)).toContain('evidence_json');
    expect(masteryConfig.columns.map((column) => column.name)).toContain('last_assessment_id');
    expect(masteryConfig.checks).toHaveLength(3);
  });

  it('stores actual practice time separately from the planned duration', () => {
    const config = getTableConfig(practiceSessions);
    const names = config.columns.map((column) => column.name);

    expect(names).toContain('planned_minutes');
    expect(names).toContain('actual_duration_seconds');
    expect(names).toContain('ended_at');
  });

  it('does not define identity or authentication tables before cloud sync is designed', () => {
    const tableNames = [
      getTableConfig(learnerProfiles).name,
      getTableConfig(skillAssessmentAttempts).name,
      getTableConfig(practiceSessions).name
    ];

    expect(tableNames).not.toContain('users');
    expect(tableNames).not.toContain('sessions');
  });
});
