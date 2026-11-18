import { describe, expect, it } from 'vitest';
import {
  isCacheablePublicNavigation,
  isEligiblePublicNavigation
} from './offline-cache-policy';

const origin = 'https://guitarlab.example';
const publicPaths = new Set(['/', '/learn', '/learn/year-1']);

const request = (overrides: Record<string, string> = {}) =>
  ({ method: 'GET', mode: 'navigate', ...overrides }) as Request;

const response = (headers: Record<string, string> = {}) =>
  ({
    status: 200,
    type: 'basic',
    headers: new Headers({
      'content-type': 'text/html; charset=utf-8',
      ...headers
    })
  }) as Response;

describe('public offline navigation cache policy', () => {
  it('allows explicitly marked prerendered public pages', () => {
    expect(
      isCacheablePublicNavigation(
        request(),
        response(),
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
    '/api/auth/session',
    '/password-reset'
  ])('rejects private route %s', (path) => {
    expect(
      isEligiblePublicNavigation(new URL(path, origin), origin, publicPaths)
    ).toBe(false);
  });

  it('rejects dynamic pages outside the prerendered allowlist', () => {
    expect(
      isEligiblePublicNavigation(
        new URL('/practice', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });

  it('rejects query-bearing URLs', () => {
    expect(
      isEligiblePublicNavigation(
        new URL('/learn?learner=private', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });

  it.each(['private', 'no-store', 'private, no-store'])(
    'rejects Cache-Control: %s',
    (cacheControl) => {
      expect(
        isCacheablePublicNavigation(
          request(),
          response({ 'cache-control': cacheControl }),
          new URL('/learn', origin),
          origin,
          publicPaths
        )
      ).toBe(false);
    }
  );

  it.each(['Cookie', 'Authorization', '*'])('rejects Vary: %s', (vary) => {
    expect(
      isCacheablePublicNavigation(
        request(),
        response({ vary }),
        new URL('/learn', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });

  it('rejects invalid methods, modes, origins and content types', () => {
    expect(
      isCacheablePublicNavigation(
        request({ method: 'POST' }),
        response(),
        new URL('/learn', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request({ mode: 'cors' }),
        response(),
        new URL('/learn', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request(),
        response(),
        new URL('/learn', 'https://other.example'),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request(),
        response({ 'content-type': 'application/json' }),
        new URL('/learn', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });
});
