import { describe, expect, it } from 'vitest';
import {
  isCacheablePublicNavigation,
  isEligiblePublicNavigation,
  resolvePublicNavigation,
  type PublicNavigationCache
} from './offline-cache-policy';

const origin = 'https://guitarlab.example';
const publicPaths = new Set(['/', '/learn/year-1']);

const request = (path = '/', overrides: Record<string, string> = {}) =>
  ({
    url: new URL(path, origin).toString(),
    method: 'GET',
    mode: 'navigate',
    ...overrides
  }) as Request;

const response = (
  headers: Record<string, string> = {},
  body = 'public page',
  status = 200
) =>
  ({
    status,
    type: 'basic',
    headers: new Headers({
      'content-type': 'text/html; charset=utf-8',
      ...headers
    }),
    clone() {
      return response(headers, body, status);
    },
    text: async () => body
  }) as unknown as Response;

const offlineResponse = () =>
  new Response('offline fallback', {
    status: 503,
    headers: { 'cache-control': 'no-store' }
  });

function cacheRequestKey(target: RequestInfo | URL): string {
  if (typeof target === 'string') return target;
  if (target instanceof URL) return target.toString();
  return target.url;
}

function createCache(seed: Record<string, Response> = {}) {
  const entries = new Map(Object.entries(seed));
  const cache: PublicNavigationCache = {
    async match(target) {
      return entries.get(cacheRequestKey(target));
    },
    async put(target, value) {
      entries.set(cacheRequestKey(target), value);
    },
    async delete(target) {
      return entries.delete(cacheRequestKey(target));
    }
  };
  return { cache, entries };
}

describe('public offline navigation cache policy', () => {
  it('allows allowlisted prerendered public pages', () => {
    expect(
      isCacheablePublicNavigation(
        request(),
        response(),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(true);
  });

  it('allows dynamic public pages only with an explicit public directive', () => {
    expect(
      isCacheablePublicNavigation(
        request('/learn'),
        response({ 'cache-control': 'public, max-age=0, must-revalidate' }),
        new URL('/learn', origin),
        origin,
        publicPaths
      )
    ).toBe(true);
  });

  it.each([
    '/account',
    '/login',
    '/register',
    '/signup',
    '/verify',
    '/api/auth/session',
    '/password-reset',
    '/account/settings'
  ])('rejects private route %s', (path) => {
    expect(isEligiblePublicNavigation(new URL(path, origin), origin)).toBe(
      false
    );
  });

  it('rejects cross-origin and query-bearing navigation targets', () => {
    expect(
      isEligiblePublicNavigation(
        new URL('/learn?learner=private', origin),
        origin
      )
    ).toBe(false);
    expect(
      isEligiblePublicNavigation(
        new URL('/learn', 'https://other.example'),
        origin
      )
    ).toBe(false);
  });

  it('rejects dynamic pages without an explicit public directive', () => {
    expect(
      isCacheablePublicNavigation(
        request('/practice'),
        response(),
        new URL('/practice', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });

  it.each(['private', 'no-store', 'private, no-store', 'private="Set-Cookie"'])(
    'rejects Cache-Control: %s',
    (cacheControl) => {
      expect(
        isCacheablePublicNavigation(
          request('/learn/year-1'),
          response({ 'cache-control': cacheControl }),
          new URL('/learn/year-1', origin),
          origin,
          publicPaths
        )
      ).toBe(false);
    }
  );

  it.each(['Cookie', 'Authorization', '*'])('rejects Vary: %s', (vary) => {
    expect(
      isCacheablePublicNavigation(
        request('/learn/year-1'),
        response({ vary }),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });

  it('rejects invalid methods, modes and content types', () => {
    expect(
      isCacheablePublicNavigation(
        request('/learn/year-1', { method: 'POST' }),
        response(),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request('/learn/year-1', { mode: 'cors' }),
        response(),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request('/learn/year-1'),
        response({ 'content-type': 'application/json' }),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });

  it('serves a previously cached public lesson when offline', async () => {
    const target = request('/learn/year-1');
    const page = response();
    const { cache } = createCache({ [target.url]: page });

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => {
          throw new Error('network should not be used while offline');
        },
        offlineResponse
      }
    );

    expect(result).toBe(page);
  });

  it('does not replay a cached authenticated dashboard after logout', async () => {
    const target = request('/');
    const privatePage = response({
      'cache-control': 'private, no-store'
    });
    const { cache, entries } = createCache({ [target.url]: privatePage });

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => {
          throw new Error('network should not be used while offline');
        },
        offlineResponse
      }
    );

    expect(result.status).toBe(503);
    expect(await result.text()).toBe('offline fallback');
    expect(entries.has(target.url)).toBe(false);
  });

  it('does not read a private account cache entry while offline', async () => {
    const target = request('/account');
    const { cache } = createCache({
      [target.url]: response({ 'cache-control': 'private, no-store' })
    });
    let cacheReads = 0;
    let networkRequests = 0;
    const trackedCache: PublicNavigationCache = {
      async match(request) {
        cacheReads += 1;
        return cache.match(request);
      },
      put: (request, value) => cache.put(request, value),
      delete: (request) => cache.delete(request)
    };

    const result = await resolvePublicNavigation(
      target,
      trackedCache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => {
          networkRequests += 1;
          throw new Error('network unavailable');
        },
        offlineResponse
      }
    );

    expect(result.status).toBe(503);
    expect(cacheReads).toBe(0);
    expect(networkRequests).toBe(1);
  });

  it('tries the network before serving a previously cached public page', async () => {
    const target = request('/learn/year-1');
    const stalePage = response({}, 'stale page');
    const freshPage = response({}, 'fresh page');
    const { cache, entries } = createCache({ [target.url]: stalePage });
    let networkRequests = 0;

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => {
          networkRequests += 1;
          return freshPage;
        },
        offlineResponse
      }
    );

    expect(result).toBe(freshPage);
    expect(networkRequests).toBe(1);
    expect(entries.get(target.url)).not.toBe(stalePage);
  });

  it('uses a cached public page when the server returns a transient 5xx response', async () => {
    const target = request('/learn/year-1');
    const cachedPage = response({}, 'cached public page');
    const { cache } = createCache({ [target.url]: cachedPage });

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => response({}, 'upstream unavailable', 503),
        offlineResponse
      }
    );

    expect(result).toBe(cachedPage);
  });

  it('preserves a 404 response instead of masking it with stale cached content', async () => {
    const target = request('/learn/year-1');
    const cachedPage = response({}, 'old page');
    const { cache } = createCache({ [target.url]: cachedPage });

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => response({}, 'not found', 404),
        offlineResponse
      }
    );

    expect(result.status).toBe(404);
    expect(await result.text()).toBe('not found');
  });

  it('updates the public page cache after a successful network response', async () => {
    const target = request('/learn/year-1');
    const page = response();
    const { cache, entries } = createCache();
    let trimmed = false;

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => page,
        offlineResponse,
        afterCacheWrite: async () => {
          trimmed = true;
        }
      }
    );

    expect(result).toBe(page);
    expect(entries.has(target.url)).toBe(true);
    expect(trimmed).toBe(true);
  });

  it('uses a cached public page when the online request fails', async () => {
    const target = request('/learn/year-1');
    const page = response();
    const { cache } = createCache({ [target.url]: page });

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => {
          throw new Error('temporary network failure');
        },
        offlineResponse
      }
    );

    expect(result).toBe(page);
  });

  it('does not cache private responses and still returns them to the active request', async () => {
    const target = request('/learn/year-1');
    const privatePage = response({ 'cache-control': 'private, no-store' });
    const { cache, entries } = createCache();

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => privatePage,
        offlineResponse
      }
    );

    expect(result).toBe(privatePage);
    expect(entries.has(target.url)).toBe(false);
  });

  it('keeps a successful online response when Cache Storage writes fail', async () => {
    const target = request('/learn/year-1');
    const page = response();
    const cache: PublicNavigationCache = {
      async match() {
        return undefined;
      },
      async put() {
        throw new Error('storage quota exceeded');
      },
      async delete() {
        return false;
      }
    };

    const result = await resolvePublicNavigation(
      target,
      cache,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => page,
        offlineResponse
      }
    );

    expect(result).toBe(page);
  });

  it('returns a no-store fallback when no cached response exists and the network fails', async () => {
    const target = request('/learn/year-1');

    const result = await resolvePublicNavigation(
      target,
      null,
      new URL(target.url),
      origin,
      publicPaths,
      {
        fetchNavigation: async () => {
          throw new Error('network unavailable');
        },
        offlineResponse
      }
    );

    expect(result.status).toBe(503);
    expect(result.headers.get('cache-control')).toBe('no-store');
  });
});
