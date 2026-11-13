import { describe, expect, it } from 'vitest';
import type { PracticeSessionRecord } from '../repositories/contracts';
import { filterPracticeSessions } from './practice-history';

const now = Date.UTC(2026, 10, 13, 12);
const session = (
  id: string,
  values: Partial<PracticeSessionRecord> = {}
): PracticeSessionRecord => ({
  id,
  learnerId: 'learner-1',
  primaryCurriculumReleaseId: null,
  primaryLessonId: null,
  status: 'completed',
  activeStartedAt: null,
  plannedMinutes: 20,
  actualDurationSeconds: 600,
  focus: null,
  difficulty: null,
  reflection: null,
  nextTarget: null,
  startedAt: now - 1_000,
  endedAt: now,
  createdAt: now - 1_000,
  updatedAt: now,
  ...values
});

const records = [
  session('focus', {
    focus: 'G major scale',
    startedAt: now - 2 * 86_400_000
  }),
  session('reflection', {
    reflection: 'Relax my wrist',
    startedAt: now - 10 * 86_400_000
  }),
  session('target', {
    nextTarget: 'Try 70 BPM',
    startedAt: now - 40 * 86_400_000
  }),
  session('paused', {
    status: 'paused',
    focus: 'Chord changes',
    startedAt: now - 86_400_000
  })
];

const defaults = {
  query: '',
  status: 'all' as const,
  dateRange: 'all' as const,
  now
};

describe('Practice Studio history filters', () => {
  it('searches focus, reflection and next-target text case-insensitively', () => {
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        query: 'G MAJOR'
      }).map((item) => item.id)
    ).toEqual(['focus']);
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        query: 'wrist'
      }).map((item) => item.id)
    ).toEqual(['reflection']);
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        query: '70 bpm'
      }).map((item) => item.id)
    ).toEqual(['target']);
  });

  it('normalizes surrounding whitespace in the search query', () => {
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        query: '  chord changes  '
      }).map((item) => item.id)
    ).toEqual(['paused']);
  });

  it('matches an exact session status', () => {
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        status: 'paused'
      }).map((item) => item.id)
    ).toEqual(['paused']);
  });

  it.each([
    ['7', ['focus', 'paused']],
    ['30', ['focus', 'reflection', 'paused']],
    ['90', ['focus', 'reflection', 'target', 'paused']]
  ] as const)(
    'applies the rolling %s-day window',
    (dateRange, expected) => {
      expect(
        filterPracticeSessions(records, {
          ...defaults,
          dateRange
        }).map((item) => item.id)
      ).toEqual(expected);
    }
  );

  it('combines search, status and date filters', () => {
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        query: 'chord',
        status: 'paused',
        dateRange: '7'
      }).map((item) => item.id)
    ).toEqual(['paused']);
  });

  it('returns no matches when no record satisfies the filters', () => {
    expect(
      filterPracticeSessions(records, {
        ...defaults,
        query: 'banjo'
      })
    ).toEqual([]);
  });

  it('does not mutate the supplied session list', () => {
    const original = [...records];
    filterPracticeSessions(records, { ...defaults, status: 'completed' });
    expect(records).toEqual(original);
  });

  it('does not search internal identifiers or generated metadata', () => {
    expect(
      filterPracticeSessions([session('private-id')], {
        ...defaults,
        query: 'private-id'
      })
    ).toEqual([]);
  });
});
