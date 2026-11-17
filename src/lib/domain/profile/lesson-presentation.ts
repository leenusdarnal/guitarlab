import type { ProfilePreferences } from './preferences';

export type LessonPresentation = NonNullable<
  ProfilePreferences['lessonPresentation']
>;

export const lessonPresentationOptions = [
  {
    value: 'balanced',
    label: 'Balanced mix',
    description: 'Keep the full lesson in its authored learning sequence.'
  },
  {
    value: 'visual-first',
    label: 'Visual-first',
    description: 'Bring demonstrations and worked walkthroughs to the front.'
  },
  {
    value: 'demonstration-first',
    label: 'Demonstration-first',
    description: 'Start with a reference and guided steps before the explanation.'
  },
  {
    value: 'text-first',
    label: 'Text-first',
    description: 'Start with the plain-language idea, refreshers and examples.'
  },
  {
    value: 'interactive-first',
    label: 'Interactive-first',
    description: 'Move practical exercises and hands-on sections earlier.'
  },
  {
    value: 'song-first',
    label: 'Song-first',
    description: 'Start with the musical application, then unpack how to play it.'
  }
] as const satisfies ReadonlyArray<{
  value: LessonPresentation;
  label: string;
  description: string;
}>;

export const lessonPresentationSectionIds = [
  'overview',
  'prerequisites',
  'key-idea',
  'demonstration',
  'walkthrough',
  'exercises',
  'music',
  'success',
  'coaching',
  'recall',
  'session'
] as const;

export type LessonPresentationSection =
  (typeof lessonPresentationSectionIds)[number];

const sectionSequences: Record<
  LessonPresentation,
  readonly LessonPresentationSection[]
> = {
  balanced: [
    'overview',
    'prerequisites',
    'key-idea',
    'demonstration',
    'walkthrough',
    'exercises',
    'music',
    'success',
    'coaching',
    'recall',
    'session'
  ],
  'visual-first': [
    'demonstration',
    'walkthrough',
    'overview',
    'key-idea',
    'exercises',
    'music',
    'success',
    'coaching',
    'prerequisites',
    'recall',
    'session'
  ],
  'demonstration-first': [
    'demonstration',
    'walkthrough',
    'exercises',
    'key-idea',
    'overview',
    'music',
    'success',
    'coaching',
    'prerequisites',
    'recall',
    'session'
  ],
  'text-first': [
    'overview',
    'key-idea',
    'prerequisites',
    'walkthrough',
    'success',
    'coaching',
    'demonstration',
    'exercises',
    'music',
    'recall',
    'session'
  ],
  'interactive-first': [
    'exercises',
    'walkthrough',
    'demonstration',
    'success',
    'coaching',
    'music',
    'key-idea',
    'overview',
    'prerequisites',
    'recall',
    'session'
  ],
  'song-first': [
    'music',
    'demonstration',
    'exercises',
    'walkthrough',
    'key-idea',
    'overview',
    'success',
    'coaching',
    'prerequisites',
    'recall',
    'session'
  ]
};

export function resolveLessonPresentation(
  preference: ProfilePreferences['lessonPresentation']
): LessonPresentation {
  return preference ?? 'balanced';
}

/** The reader uses CSS flex order so authored content and progress IDs stay unchanged. */
export function getLessonPresentationSectionOrder(
  preference: ProfilePreferences['lessonPresentation'],
  section: LessonPresentationSection
): number {
  return sectionSequences[resolveLessonPresentation(preference)].indexOf(section) + 1;
}

export function getLessonPresentationSectionSequence(
  preference: ProfilePreferences['lessonPresentation']
): readonly LessonPresentationSection[] {
  return sectionSequences[resolveLessonPresentation(preference)];
}
