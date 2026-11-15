import { describe, expect, it } from 'vitest';
import {
  BACKUP_REMINDER_INTERVAL_MS,
  LAST_BACKUP_EXPORT_AT_KEY,
  clearLastBackupExportAt,
  readLastBackupExportAt,
  recordLastBackupExportAt,
  shouldShowBackupReminder
} from './backup-metadata';

function createStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    values,
    storage: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
      removeItem: (key: string) => {
        values.delete(key);
      }
    }
  };
}

describe('backup download metadata', () => {
  it('records and reads the time a download was started', () => {
    const { storage } = createStorage();
    const exportedAt = 1_800_000_000_000;

    expect(recordLastBackupExportAt(storage, exportedAt)).toBe(true);
    expect(storage.getItem(LAST_BACKUP_EXPORT_AT_KEY)).toBe(
      String(exportedAt)
    );
    expect(readLastBackupExportAt(storage, exportedAt + 10)).toBe(exportedAt);
  });

  it('does not infer a timestamp when storage has no record', () => {
    const { storage } = createStorage();

    expect(readLastBackupExportAt(storage, 1_800_000_000_000)).toBeNull();
  });

  it.each(['', 'yesterday', '-1', '9007199254740992'])(
    'rejects invalid stored values (%s)',
    (stored) => {
      const { storage } = createStorage({
        [LAST_BACKUP_EXPORT_AT_KEY]: stored
      });

      expect(readLastBackupExportAt(storage, 1_800_000_000_000)).toBeNull();
    }
  );

  it('rejects a timestamp that lies in the future', () => {
    const { storage } = createStorage({
      [LAST_BACKUP_EXPORT_AT_KEY]: '1800000000001'
    });

    expect(readLastBackupExportAt(storage, 1_800_000_000_000)).toBeNull();
  });

  it('clears the timestamp after restore or reset', () => {
    const { storage } = createStorage({
      [LAST_BACKUP_EXPORT_AT_KEY]: '1800000000000'
    });

    expect(clearLastBackupExportAt(storage)).toBe(true);
    expect(readLastBackupExportAt(storage, 1_800_000_000_100)).toBeNull();
  });

  it('does not throw when browser storage is unavailable', () => {
    const unavailableStorage = {
      getItem: () => {
        throw new Error('Storage disabled');
      },
      setItem: () => {
        throw new Error('Storage disabled');
      },
      removeItem: () => {
        throw new Error('Storage disabled');
      }
    };

    expect(readLastBackupExportAt(unavailableStorage)).toBeNull();
    expect(recordLastBackupExportAt(unavailableStorage, 1_800_000_000_000)).toBe(
      false
    );
    expect(clearLastBackupExportAt(unavailableStorage)).toBe(false);
  });

  it('shows a reminder until a recent download has been started', () => {
    const now = 1_800_000_000_000;

    expect(shouldShowBackupReminder(null, now)).toBe(true);
    expect(
      shouldShowBackupReminder(now - BACKUP_REMINDER_INTERVAL_MS + 1, now)
    ).toBe(false);
    expect(
      shouldShowBackupReminder(now - BACKUP_REMINDER_INTERVAL_MS, now)
    ).toBe(true);
    expect(
      shouldShowBackupReminder(now - BACKUP_REMINDER_INTERVAL_MS - 1, now)
    ).toBe(true);
  });
});
