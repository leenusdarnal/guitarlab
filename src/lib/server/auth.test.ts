import { describe, expect, it } from 'vitest';
import { isAuthConfigured } from './auth';

const configuredEnvironment = {
  AUTH_DB: {} as D1Database,
  BETTER_AUTH_SECRET: 'a'.repeat(48),
  BETTER_AUTH_URL: 'https://guitarlab.example',
  GOOGLE_CLIENT_ID: 'google-client',
  GOOGLE_CLIENT_SECRET: 'google-secret'
};

describe('isAuthConfigured', () => {
  it('fails closed when the dedicated auth database is absent', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, AUTH_DB: undefined })).toBe(false);
  });

  it('requires a high-entropy secret', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_SECRET: 'too-short' })).toBe(false);
  });

  it('requires HTTPS for public origins and allows HTTP only for local development', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_URL: 'guitarlab.example' })).toBe(false);
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_URL: 'http://guitarlab.example' })).toBe(false);
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_URL: 'https://guitarlab.example/path' })).toBe(false);
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_URL: 'http://localhost:8787' })).toBe(true);
  });

  it('requires at least one complete Google or GitHub OAuth provider', () => {
    expect(isAuthConfigured({
      ...configuredEnvironment,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined
    })).toBe(false);
    expect(isAuthConfigured({
      ...configuredEnvironment,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      GITHUB_CLIENT_ID: 'github-client',
      GITHUB_CLIENT_SECRET: 'github-secret'
    })).toBe(true);
    expect(isAuthConfigured({
      ...configuredEnvironment,
      GOOGLE_CLIENT_ID: undefined,
      GOOGLE_CLIENT_SECRET: undefined,
      GITHUB_CLIENT_ID: 'github-client'
    })).toBe(false);
  });

  it('accepts a fully configured isolated OAuth environment', () => {
    expect(isAuthConfigured(configuredEnvironment)).toBe(true);
  });

  it('allows bounded session timing overrides only for local origins', () => {
    expect(isAuthConfigured({
      ...configuredEnvironment,
      BETTER_AUTH_URL: 'http://localhost:8787',
      AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
      AUTH_TEST_SESSION_UPDATE_AGE_SECONDS: '2'
    })).toBe(true);
    expect(isAuthConfigured({
      ...configuredEnvironment,
      AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
      AUTH_TEST_SESSION_UPDATE_AGE_SECONDS: '2'
    })).toBe(false);
    expect(isAuthConfigured({
      ...configuredEnvironment,
      BETTER_AUTH_URL: 'http://localhost:8787',
      AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
      AUTH_TEST_SESSION_UPDATE_AGE_SECONDS: '12'
    })).toBe(false);
    expect(isAuthConfigured({
      ...configuredEnvironment,
      BETTER_AUTH_URL: 'http://localhost:8787',
      AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '61'
    })).toBe(false);
  });
});
