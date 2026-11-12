import { describe, expect, it, vi } from 'vitest';
import {
  getLocalStoragePersistenceStatus,
  requestLocalStoragePersistence
} from './persistence';

describe('local learner storage persistence', () => {
  it('reports the browser persistence grant and approximate storage usage', async () => {
    const manager = {
      persisted: vi.fn().mockResolvedValue(true),
      persist: vi.fn().mockResolvedValue(true),
      estimate: vi.fn().mockResolvedValue({ usage: 128, quota: 1024 })
    };

    await expect(getLocalStoragePersistenceStatus(manager)).resolves.toEqual({
      canRequest: true,
      persisted: true,
      usageBytes: 128,
      quotaBytes: 1024
    });
  });

  it('requests persistence only when explicitly invoked', async () => {
    const manager = {
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
      estimate: vi.fn().mockResolvedValue({ usage: 0, quota: 4096 })
    };

    const status = await requestLocalStoragePersistence(manager);

    expect(manager.persist).toHaveBeenCalledOnce();
    expect(status.persisted).toBe(false);
    expect(status.canRequest).toBe(true);
  });

  it('reports unsupported browser storage without throwing', async () => {
    await expect(getLocalStoragePersistenceStatus(null)).resolves.toEqual({
      canRequest: false,
      persisted: null,
      usageBytes: null,
      quotaBytes: null
    });
    await expect(requestLocalStoragePersistence(null)).resolves.toEqual({
      canRequest: false,
      persisted: null,
      usageBytes: null,
      quotaBytes: null
    });
  });

  it('handles rejected browser storage APIs without losing the page', async () => {
    const manager = {
      persisted: vi.fn().mockRejectedValue(new Error('blocked')),
      persist: vi.fn().mockRejectedValue(new Error('denied')),
      estimate: vi.fn().mockRejectedValue(new Error('unavailable'))
    };

    await expect(requestLocalStoragePersistence(manager)).resolves.toEqual({
      canRequest: true,
      persisted: null,
      usageBytes: null,
      quotaBytes: null
    });
  });
});
