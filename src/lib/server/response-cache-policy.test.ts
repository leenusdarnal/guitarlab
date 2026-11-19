import { describe, expect, it } from 'vitest';
import { applyPrivateResponseCachePolicy } from './response-cache-policy';

describe('private response cache policy', () => {
  it('marks cookie-setting responses private and non-cacheable', () => {
    const headers = new Headers({
      'Cache-Control': 'public, max-age=3600',
      'X-GuitarLab-Cache': 'public'
    });
    headers.set('Set-Cookie', 'session=opaque; Path=/; HttpOnly; Secure');

    applyPrivateResponseCachePolicy(headers, {
      authenticated: false,
      privatePath: false
    });

    expect(headers.get('Cache-Control')).toBe('private, no-store');
    expect(headers.has('X-GuitarLab-Cache')).toBe(false);
  });

  it('marks authenticated responses private and non-cacheable', () => {
    const headers = new Headers({ 'Cache-Control': 'public' });

    applyPrivateResponseCachePolicy(headers, {
      authenticated: true,
      privatePath: false
    });

    expect(headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('marks identity and API routes private and non-cacheable', () => {
    const headers = new Headers({ 'Cache-Control': 'public' });

    applyPrivateResponseCachePolicy(headers, {
      authenticated: false,
      privatePath: true
    });

    expect(headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('leaves an ordinary public response cache policy unchanged', () => {
    const headers = new Headers({ 'Cache-Control': 'public, max-age=3600' });

    applyPrivateResponseCachePolicy(headers, {
      authenticated: false,
      privatePath: false
    });

    expect(headers.get('Cache-Control')).toBe('public, max-age=3600');
  });
});
