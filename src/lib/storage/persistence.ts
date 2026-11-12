export type StorageManagerPort = {
  persisted?: () => Promise<boolean>;
  persist?: () => Promise<boolean>;
  estimate?: () => Promise<{ usage?: number; quota?: number }>;
};

export type LearnerStoragePersistenceStatus = {
  canRequest: boolean;
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
  requestGranted: boolean | null;
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
export async function getLearnerStoragePersistenceStatus(
  manager: StorageManagerPort | null = getBrowserStorageManager()
): Promise<LearnerStoragePersistenceStatus> {
  if (!manager) {
    return {
      canRequest: false,
      persisted: null,
      usageBytes: null,
      quotaBytes: null,
      requestGranted: null
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
    quotaBytes,
    requestGranted: null
  };
}

/** Request persistent origin storage only when explicitly invoked by the learner. */
export async function requestLearnerStoragePersistence(
  manager: StorageManagerPort | null = getBrowserStorageManager()
): Promise<LearnerStoragePersistenceStatus> {
  if (!manager?.persist) return getLearnerStoragePersistenceStatus(manager);

  let requestGranted: boolean | null = null;
  try {
    requestGranted = await manager.persist();
  } catch {
    // The browser may deny or reject this request; data remains best-effort.
  }

  return {
    ...(await getLearnerStoragePersistenceStatus(manager)),
    requestGranted
  };
}
