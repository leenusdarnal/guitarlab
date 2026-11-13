import type { PracticeSessionRecord } from '../repositories/contracts';

export type PracticeHistoryStatus = PracticeSessionRecord['status'] | 'all';
export type PracticeHistoryDateRange = 'all' | '7' | '30' | '90';

export type PracticeHistoryFilters = {
  query: string;
  status: PracticeHistoryStatus;
  dateRange: PracticeHistoryDateRange;
  now: number;
};

/**
 * Filter the active learner's already-loaded practice history.
 * Search is intentionally limited to learner-authored focus and notes.
 * This function is pure: it never mutates the supplied records.
 */
export function filterPracticeSessions(
  sessions: readonly PracticeSessionRecord[],
  filters: PracticeHistoryFilters
): PracticeSessionRecord[] {
  const query = filters.query.trim().toLocaleLowerCase();
  const days = filters.dateRange === 'all' ? null : Number(filters.dateRange);
  const cutoff =
    days === null ? null : filters.now - days * 24 * 60 * 60 * 1000;

  return sessions.filter((session) => {
    if (filters.status !== 'all' && session.status !== filters.status) {
      return false;
    }

    if (
      cutoff !== null &&
      (session.startedAt < cutoff || session.startedAt > filters.now)
    ) {
      return false;
    }

    if (!query) return true;

    return [session.focus, session.reflection, session.nextTarget].some(
      (value) => value?.toLocaleLowerCase().includes(query) ?? false
    );
  });
}
