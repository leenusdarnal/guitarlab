import practiceTaxonomy from '../../../content/curriculum/practice-taxonomy.json';
import year1Lessons from '../../../content/curriculum/year-1-lessons.json';
import year2Lessons from '../../../content/curriculum/year-2-lessons.json';
import year3Lessons from '../../../content/curriculum/year-3-specialisation-lessons.json';
import { ACTIVE_CURRICULUM_RELEASE_ID } from './skill-catalog';

type PracticeScopeRecord = {
  lessonId: string;
  exerciseId: string;
  topicIds: string[];
  techniqueIds: string[];
  stringNumbers: number[];
  fretPositionIds: string[];
  fretRange?: { minFret: number; maxFret: number } | null;
  sourceEvidence: string;
};

type PracticeTaxonomySnapshotRecord = {
  version: string;
  exerciseScopes: PracticeScopeRecord[];
};

type AuthoredLesson = {
  id: string;
  curriculumId: string;
  curriculumWeekId: string;
  week: number;
  route: string;
  title: string;
  focus: string;
  estimatedMinutes: number;
  exercises: { id: string; title: string }[];
};

export type AuthoredPracticeScope = PracticeScopeRecord &
  Pick<
    AuthoredLesson,
    | 'curriculumId'
    | 'curriculumWeekId'
    | 'week'
    | 'route'
    | 'focus'
    | 'estimatedMinutes'
  > & {
    lessonTitle: string;
    exerciseTitle: string;
  };

const lessonSets = [
  year1Lessons.lessons,
  year2Lessons.lessons,
  year3Lessons.lessons
] as unknown as AuthoredLesson[][];
const lessonsById = new Map(
  lessonSets.flat().map((lesson) => [lesson.id, lesson])
);
const scopeRecords = practiceTaxonomy.exerciseScopes as PracticeScopeRecord[];
const previousVersions = (practiceTaxonomy.previousVersions ??
  []) as PracticeTaxonomySnapshotRecord[];

export const PRACTICE_TAXONOMY_VERSION = practiceTaxonomy.version;
export const PRACTICE_TAXONOMY_RELEASE_ID =
  practiceTaxonomy.curriculumReleaseId;

export type AuthoredPracticeDimensionCategory =
  'topic' | 'technique' | 'string' | 'fret_position';

export type AuthoredPracticeDimension = {
  category: AuthoredPracticeDimensionCategory;
  id: string;
  label: string;
};

export type AuthoredPracticeScopeSnapshot = {
  version: string;
  scopes: AuthoredPracticeScope[];
};

/** Resolve only exact lesson/exercise IDs present in the authored curriculum. */
function resolveScopeRecords(
  records: readonly PracticeScopeRecord[]
): AuthoredPracticeScope[] {
  return records
    .flatMap((scope) => {
      const lesson = lessonsById.get(scope.lessonId);
      const exercise = lesson?.exercises.find(
        (item) => item.id === scope.exerciseId
      );
      if (!lesson || !exercise) return [];

      return [
        {
          ...scope,
          topicIds: [...scope.topicIds],
          techniqueIds: [...scope.techniqueIds],
          stringNumbers: [...scope.stringNumbers],
          fretPositionIds: [...scope.fretPositionIds],
          curriculumId: lesson.curriculumId,
          curriculumWeekId: lesson.curriculumWeekId,
          week: lesson.week,
          route: lesson.route,
          lessonTitle: lesson.title,
          focus: lesson.focus,
          estimatedMinutes: lesson.estimatedMinutes,
          exerciseTitle: exercise.title
        }
      ];
    })
    .sort(
      (left, right) =>
        left.lessonId.localeCompare(right.lessonId) ||
        left.exerciseId.localeCompare(right.exerciseId)
    );
}

/** List only dimensions defined by the active authored taxonomy. */
export function listAuthoredPracticeDimensions(): AuthoredPracticeDimension[] {
  if (PRACTICE_TAXONOMY_RELEASE_ID !== ACTIVE_CURRICULUM_RELEASE_ID) {
    return [];
  }

  const dimensions: AuthoredPracticeDimension[] = [
    ...practiceTaxonomy.topics.map((item) => ({
      category: 'topic' as const,
      id: item.id,
      label: item.label
    })),
    ...practiceTaxonomy.techniques.map((item) => ({
      category: 'technique' as const,
      id: item.id,
      label: item.label
    })),
    ...practiceTaxonomy.strings.map((item) => ({
      category: 'string' as const,
      id: String(item.number),
      label: item.label
    })),
    ...practiceTaxonomy.fretPositions.map((item) => ({
      category: 'fret_position' as const,
      id: item.id,
      label: item.label
    }))
  ];

  return dimensions.sort(
    (left, right) =>
      left.category.localeCompare(right.category) ||
      left.label.localeCompare(right.label)
  );
}

/**
 * Return current exercise scopes for selection in new Practice Studio sessions.
 * A missing or stale taxonomy is unavailable, never guessed from free text.
 */
export function listAuthoredPracticeScopes(): AuthoredPracticeScope[] {
  if (PRACTICE_TAXONOMY_RELEASE_ID !== ACTIVE_CURRICULUM_RELEASE_ID) {
    return [];
  }
  return resolveScopeRecords(scopeRecords);
}

/**
 * Return immutable scope snapshots for every supported taxonomy version.
 * Historical versions are read-only compatibility data: new sessions always
 * use the current version, while exact prior links remain valid for analytics.
 */
export function listAuthoredPracticeScopeSnapshots(): AuthoredPracticeScopeSnapshot[] {
  if (PRACTICE_TAXONOMY_RELEASE_ID !== ACTIVE_CURRICULUM_RELEASE_ID) {
    return [];
  }

  return [
    ...previousVersions.map((snapshot) => ({
      version: snapshot.version,
      scopes: resolveScopeRecords(snapshot.exerciseScopes)
    })),
    {
      version: PRACTICE_TAXONOMY_VERSION,
      scopes: listAuthoredPracticeScopes()
    }
  ];
}

/** Resolve an exact authored lesson/exercise pair; unknown IDs stay untagged. */
export function getAuthoredPracticeScope(
  lessonId: string,
  exerciseId: string
): AuthoredPracticeScope | null {
  return (
    listAuthoredPracticeScopes().find(
      (scope) => scope.lessonId === lessonId && scope.exerciseId === exerciseId
    ) ?? null
  );
}
