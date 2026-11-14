import { describe, expect, it } from 'vitest';
import {
  findCurriculumLesson,
  findCurriculumRoute,
  getCurriculumStats,
  listCurriculumRoutes
} from './catalog';

describe('versioned authored curriculum catalogue', () => {
  it('loads all 152 authored lessons across six routes', () => {
    expect(getCurriculumStats()).toEqual({
      routes: 6,
      year1: 52,
      year2: 52,
      specialisations: 48,
      totalLessons: 152
    });
    expect(listCurriculumRoutes().map((route) => route.id)).toEqual([
      'year-1',
      'year-2',
      'rock-blues',
      'fingerstyle-acoustic',
      'jazz-harmony',
      'all-round-musician'
    ]);
  });

  it('preserves Year 1 ordering, stable IDs and phase grouping', () => {
    const route = findCurriculumRoute('year-1');
    expect(route?.weeks).toHaveLength(52);
    expect(route?.phases.map((phase) => phase.id)).toEqual([
      'beginner-base',
      'skills-in-context',
      'early-intermediate',
      'intermediate-bridge'
    ]);
    expect(route?.weeks[0]).toMatchObject({
      id: 'y1-w01',
      lessonId: 'y1-w01-lesson',
      week: 1,
      phaseId: 'beginner-base'
    });
    expect(route?.weeks[51]).toMatchObject({
      id: 'y1-w52',
      lessonId: 'y1-w52-lesson',
      week: 52,
      phaseId: 'intermediate-bridge'
    });
  });

  it('preserves Year 2 order and its authored phase boundaries', () => {
    const route = findCurriculumRoute('year-2');
    expect(route?.weeks).toHaveLength(52);
    expect(route?.weeks[0].lessonId).toBe('y2-w01-lesson');
    expect(route?.weeks[51].lessonId).toBe('y2-w52-lesson');
    expect(route?.phases).toHaveLength(9);
    expect(route?.weeks[11].phaseId).toBe('scales-melody');
  });

  it('loads all 12 lessons in each optional specialisation', () => {
    for (const id of [
      'rock-blues',
      'fingerstyle-acoustic',
      'jazz-harmony',
      'all-round-musician'
    ]) {
      const route = findCurriculumRoute(id);
      expect(route?.tier).toBe('Year 3+ specialisation');
      expect(route?.weeks).toHaveLength(12);
      expect(route?.weeks[0].week).toBe(1);
      expect(route?.weeks[11].week).toBe(12);
      expect(route?.phases).toHaveLength(1);
    }
  });

  it('returns the complete authored lesson by its stable ID and version', () => {
    const result = findCurriculumLesson('y1-w01-lesson');
    expect(result?.route.id).toBe('year-1');
    expect(result?.route.contentVersion).toBe('1.0.1');
    expect(result?.lesson).toMatchObject({
      id: 'y1-w01-lesson',
      curriculumWeekId: 'y1-w01',
      week: 1,
      title: 'Meet your guitar'
    });
    expect(result?.lesson.accessibleAlternative.length).toBeGreaterThan(0);
    expect(result?.lesson.prerequisites).toEqual([]);
  });

  it('returns a specialist lesson using its stable route and lesson identifiers', () => {
    const result = findCurriculumLesson('y3-jazz-harmony-w01-lesson');
    expect(result?.route.id).toBe('jazz-harmony');
    expect(result?.week.id).toBe('y3-jazz-harmony-w01');
    expect(result?.route.contentVersion).toBe('1.0.3');
    expect(result?.lesson.route).toBe('jazz-harmony');
  });

  it('returns null for unknown routes and lesson IDs', () => {
    expect(findCurriculumRoute('not-a-route')).toBeNull();
    expect(findCurriculumLesson('not-a-lesson')).toBeNull();
  });
});
