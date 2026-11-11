import year1Outline from '../../../../content/curriculum/year-1.json';
import year1Content from '../../../../content/curriculum/year-1-lessons.json';
import year2Outline from '../../../../content/curriculum/year-2.json';
import year2Content from '../../../../content/curriculum/year-2-lessons.json';
import year3Outline from '../../../../content/curriculum/year-3-specialisations.json';
import year3Content from '../../../../content/curriculum/year-3-specialisation-lessons.json';

type Year1Lesson = (typeof year1Content.lessons)[number];
type Year2Lesson = (typeof year2Content.lessons)[number];
type Year3Lesson = (typeof year3Content.lessons)[number];

export type AuthoredLesson = Year1Lesson | Year2Lesson | Year3Lesson;

export type CurriculumPhase = {
  id: string;
  title: string;
  firstWeek: number;
  lastWeek: number;
  goal: string;
};

export type CurriculumWeek = {
  id: string;
  lessonId: string;
  week: number;
  phaseId: string;
  title: string;
  focus: string;
  checkpoint: string;
  estimatedMinutes: number;
  startingTempoBpm: number | null;
};

export type CurriculumRoute = {
  id: string;
  title: string;
  tier: 'Year 1' | 'Year 2' | 'Year 3+ specialisation';
  description: string;
  goal: string;
  contentVersion: string;
  outlineVersion: string;
  phases: CurriculumPhase[];
  weeks: CurriculumWeek[];
  totalLessons: number;
};

type RouteRecord = CurriculumRoute & {
  lessons: AuthoredLesson[];
};

export type CurriculumLessonPage = {
  route: CurriculumRoute;
  phase: CurriculumPhase;
  week: CurriculumWeek;
  lesson: AuthoredLesson;
  prerequisiteReferences: Array<{
    id: string;
    title: string | null;
    available: boolean;
  }>;
};

function requireMatch<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

function buildCoreRoute(input: {
  id: 'year-1' | 'year-2';
  tier: 'Year 1' | 'Year 2';
  title: string;
  description: string;
  outlineVersion: string;
  contentVersion: string;
  phases: Array<{
    id: string;
    title: string;
    firstWeek: number;
    lastWeek: number;
    goal: string;
  }>;
  weeks: Array<{
    id: string;
    week: number;
    phaseId: string;
    title: string;
    focus: string;
    checkpoint: string;
    startingTempoBpm?: number;
  }>;
  lessons: AuthoredLesson[];
}): RouteRecord {
  const lessonByWeekId = new Map(
    input.lessons.map((lesson) => [lesson.curriculumWeekId, lesson])
  );

  const weeks = input.weeks.map((outlineWeek) => {
    const lesson = requireMatch(
      lessonByWeekId.get(outlineWeek.id),
      `Missing authored lesson for ${outlineWeek.id}.`
    );
    return {
      id: outlineWeek.id,
      lessonId: lesson.id,
      week: outlineWeek.week,
      phaseId: outlineWeek.phaseId,
      title: outlineWeek.title,
      focus: lesson.focus || outlineWeek.focus,
      checkpoint: lesson.checkpoint || outlineWeek.checkpoint,
      estimatedMinutes: lesson.estimatedMinutes,
      startingTempoBpm: lesson.startingTempoBpm ?? outlineWeek.startingTempoBpm ?? null
    };
  });

  if (weeks.length !== input.lessons.length) {
    throw new Error(`Outline and authored lesson counts do not match for ${input.id}.`);
  }

  return {
    id: input.id,
    title: input.title,
    tier: input.tier,
    description: input.description,
    goal: input.description,
    contentVersion: input.contentVersion,
    outlineVersion: input.outlineVersion,
    phases: input.phases.map((phase) => ({ ...phase })),
    weeks,
    totalLessons: weeks.length,
    lessons: input.lessons.slice().sort((a, b) => a.week - b.week)
  };
}

function buildSpecialisationRoutes(): RouteRecord[] {
  return year3Outline.paths.map((path) => {
    const routeLessons = year3Content.lessons
      .filter((lesson) => lesson.route === path.id)
      .slice()
      .sort((a, b) => a.week - b.week);
    const lessonByWeekId = new Map(
      routeLessons.map((lesson) => [lesson.curriculumWeekId, lesson])
    );
    const phaseId = `${path.id}-specialisation`;
    const phase: CurriculumPhase = {
      id: phaseId,
      title: path.title,
      firstWeek: 1,
      lastWeek: 12,
      goal: path.goal
    };
    const weeks = path.weekRecords.map((outlineWeek) => {
      const lesson = requireMatch(
        lessonByWeekId.get(outlineWeek.id),
        `Missing authored lesson for ${outlineWeek.id}.`
      );
      return {
        id: outlineWeek.id,
        lessonId: lesson.id,
        week: outlineWeek.week,
        phaseId,
        title: outlineWeek.title,
        focus: lesson.focus,
        checkpoint: lesson.checkpoint,
        estimatedMinutes: lesson.estimatedMinutes,
        startingTempoBpm: lesson.startingTempoBpm ?? null
      };
    });

    if (weeks.length !== routeLessons.length || weeks.length !== 12) {
      throw new Error(`Specialisation ${path.id} must have 12 matching authored lessons.`);
    }

    return {
      id: path.id,
      title: path.title,
      tier: 'Year 3+ specialisation',
      description: path.goal,
      goal: path.goal,
      contentVersion: year3Content.version,
      outlineVersion: year3Outline.version,
      phases: [phase],
      weeks,
      totalLessons: weeks.length,
      lessons: routeLessons
    };
  });
}

const routeRecords: RouteRecord[] = [
  buildCoreRoute({
    id: 'year-1',
    tier: 'Year 1',
    title: year1Outline.title,
    description: year1Outline.description,
    outlineVersion: year1Outline.version,
    contentVersion: year1Content.version,
    phases: year1Outline.phases,
    weeks: year1Outline.weeks,
    lessons: year1Content.lessons
  }),
  buildCoreRoute({
    id: 'year-2',
    tier: 'Year 2',
    title: year2Outline.title,
    description: year2Outline.description,
    outlineVersion: year2Outline.version,
    contentVersion: year2Content.version,
    phases: year2Outline.phases,
    weeks: year2Outline.weeks,
    lessons: year2Content.lessons
  }),
  ...buildSpecialisationRoutes()
];

const lessonLookup = new Map<string, { route: RouteRecord; lesson: AuthoredLesson }>();
for (const route of routeRecords) {
  for (const lesson of route.lessons) {
    if (lessonLookup.has(lesson.id)) {
      throw new Error(`Duplicate authored lesson ID: ${lesson.id}.`);
    }
    lessonLookup.set(lesson.id, { route, lesson });
  }
}

const totalLessons = routeRecords.reduce((total, route) => total + route.totalLessons, 0);
if (routeRecords.length !== 6 || totalLessons !== 152) {
  throw new Error(`Curriculum catalogue integrity failed: expected 6 routes and 152 lessons, got ${routeRecords.length} routes and ${totalLessons} lessons.`);
}

export function listCurriculumRoutes(): CurriculumRoute[] {
  return routeRecords.map((record) => {
    const { lessons, ...route } = record;
    void lessons;
    return {
      ...route,
      phases: route.phases.map((phase) => ({ ...phase })),
      weeks: route.weeks.map((week) => ({ ...week }))
    };
  });
}

export function getCurriculumStats() {
  return {
    routes: routeRecords.length,
    year1: routeRecords.find((route) => route.id === 'year-1')?.totalLessons ?? 0,
    year2: routeRecords.find((route) => route.id === 'year-2')?.totalLessons ?? 0,
    specialisations: routeRecords
      .filter((route) => route.tier === 'Year 3+ specialisation')
      .reduce((total, route) => total + route.totalLessons, 0),
    totalLessons
  };
}

export function findCurriculumRoute(routeId: string): CurriculumRoute | null {
  const route = routeRecords.find((item) => item.id === routeId);
  if (!route) return null;
  const { lessons, ...summary } = route;
  void lessons;
  return {
    ...summary,
    phases: summary.phases.map((phase) => ({ ...phase })),
    weeks: summary.weeks.map((week) => ({ ...week }))
  };
}

export function findCurriculumLesson(lessonId: string): CurriculumLessonPage | null {
  const match = lessonLookup.get(lessonId);
  if (!match) return null;

  const { route, lesson } = match;
  const week = requireMatch(
    route.weeks.find((item) => item.lessonId === lesson.id),
    `Missing week index for lesson ${lesson.id}.`
  );
  const phase = requireMatch(
    route.phases.find((item) => item.id === week.phaseId),
    `Missing phase index for lesson ${lesson.id}.`
  );

  return {
    route: findCurriculumRoute(route.id) as CurriculumRoute,
    phase: { ...phase },
    week: { ...week },
    lesson,
    prerequisiteReferences: lesson.prerequisites.map((id) => {
      const prerequisite = lessonLookup.get(id);
      return {
        id,
        title: prerequisite?.lesson.title ?? null,
        available: Boolean(prerequisite)
      };
    })
  };
}
