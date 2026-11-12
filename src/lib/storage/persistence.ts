export type StorageManagerPort = {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
  estimate?: () => Promise<{ usage?: number; quota?: number }>;
};

export type LocalStoragePersistenceStatus = {
  canRequest: boolean;
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
};

function getBrowserStorageManager(): StorageManagerPort | null {
  if (typeof navigator === 'undefined') return null;

  try {
    return (navigator.storage as StorageManagerPort | undefined) ?? null;
  } catch {
    return null;
  }
}

function finiteBytes(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

/** Read the browser's current storage persistence and quota information. */
export async function getLocalStoragePersistenceStatus(
  manager: StorageManagerPort | null = getBrowserStorageManager()
): Promise<LocalStoragePersistenceStatus> {
  if (!manager) {
    return {
      canRequest: false,
      persisted: null,
      usageBytes: null,
      quotaBytes: null
    };
  }

  let persisted: boolean | null = null;
  if (manager.persisted) {
    try {
      persisted = await manager.persisted();
    } catch {
      persisted = null;
    }
  }

  let usageBytes: number | null = null;
  let quotaBytes: number | null = null;
  if (manager.estimate) {
    try {
      const estimate = await manager.estimate();
      usageBytes = finiteBytes(estimate.usage);
      quotaBytes = finiteBytes(estimate.quota);
    } catch {
      // A storage estimate is advisory and must not block learner data access.
    }
  }

  return {
    canRequest: typeof manager.persist === 'function',
    persisted,
    usageBytes,
    quotaBytes
  };
}

/** Request persistent origin storage only when explicitly invoked by the learner. */
export async function requestLocalStoragePersistence(
  manager: StorageManagerPort | null = getBrowserStorageManager()
): Promise<LocalStoragePersistenceStatus> {
  if (!manager?.persist) return getLocalStoragePersistenceStatus(manager);

  try {
    await manager.persist();
  } catch {
    // The browser may deny or reject this request; data remains best-effort.
  }

  return getLocalStoragePersistenceStatus(manager);
}
