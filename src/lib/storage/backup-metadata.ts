export const LAST_BACKUP_EXPORT_AT_KEY = 'guitarlab.last-backup-export-at';
export const BACKUP_REMINDER_INTERVAL_MS = 30 * 24 * 60 * 60 * 1000;

export type BackupMetadataStorage = Pick<
  Storage,
  'getItem' | 'setItem' | 'removeItem'
>;

/**
 * Read the time GuitarLab last started a backup download.
 * This is local UI metadata, not part of the learner backup or learning record.
 */
export function readLastBackupExportAt(
  storage: Pick<BackupMetadataStorage, 'getItem'>,
  now = Date.now()
): number | null {
  try {
    const stored = storage.getItem(LAST_BACKUP_EXPORT_AT_KEY);
    if (stored === null) return null;

    const timestamp = Number(stored);
    if (!Number.isSafeInteger(timestamp) || timestamp <= 0 || timestamp > now) {
      return null;
    }

    return timestamp;
  } catch {
    return null;
  }
}

/** Save the time after the browser has been asked to start the backup download. */
export function recordLastBackupExportAt(
  storage: Pick<BackupMetadataStorage, 'setItem'>,
  timestamp = Date.now()
): boolean {
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) return false;

  try {
    storage.setItem(LAST_BACKUP_EXPORT_AT_KEY, String(timestamp));
    return true;
  } catch {
    return false;
  }
}

export function clearLastBackupExportAt(
  storage: Pick<BackupMetadataStorage, 'removeItem'>
): boolean {
  try {
    storage.removeItem(LAST_BACKUP_EXPORT_AT_KEY);
    return true;
  } catch {
    return false;
  }
}

export function shouldShowBackupReminder(
  lastBackupExportAt: number | null,
  now = Date.now()
): boolean {
  return (
    lastBackupExportAt === null ||
    !Number.isSafeInteger(lastBackupExportAt) ||
    lastBackupExportAt <= 0 ||
    now - lastBackupExportAt >= BACKUP_REMINDER_INTERVAL_MS
  );
}
