import { describe, expect, it } from 'vitest';
import {
  isCacheablePublicNavigation,
  isEligiblePublicNavigation
} from './offline-cache-policy';

const origin = 'https://guitarlab.example';
const publicPaths = new Set(['/', '/learn/year-1']);

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
        request(),
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
    '/api/auth/session',
    '/password-reset'
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
        request(),
        response(),
        new URL('/practice', origin),
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
        request(),
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
        request({ method: 'POST' }),
        response(),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request({ mode: 'cors' }),
        response(),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
    expect(
      isCacheablePublicNavigation(
        request(),
        response({ 'content-type': 'application/json' }),
        new URL('/learn/year-1', origin),
        origin,
        publicPaths
      )
    ).toBe(false);
  });
});
