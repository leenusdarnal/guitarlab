import { describe, expect, it } from 'vitest';
import { isAuthConfigured } from './auth';

const configuredEnvironment = {
  AUTH_DB: {} as D1Database,
  BETTER_AUTH_SECRET: 'a'.repeat(48),
  BETTER_AUTH_URL: 'https://guitarlab.example',
  RESEND_API_KEY: 're_test_placeholder',
  AUTH_FROM_EMAIL: 'GuitarLab <auth@guitarlab.example>'
};

describe('isAuthConfigured', () => {
  it('fails closed when the dedicated auth database is absent', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, AUTH_DB: undefined })).toBe(false);
  });

  it('requires a high-entropy secret', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_SECRET: 'too-short' })).toBe(false);
  });

  it('requires an explicit HTTP or HTTPS origin', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_URL: 'guitarlab.example' })).toBe(false);
    expect(isAuthConfigured({ ...configuredEnvironment, BETTER_AUTH_URL: 'https://guitarlab.example/path' })).toBe(false);
  });

  it('requires a transactional email provider and sender', () => {
    expect(isAuthConfigured({ ...configuredEnvironment, RESEND_API_KEY: undefined })).toBe(false);
    expect(isAuthConfigured({ ...configuredEnvironment, AUTH_FROM_EMAIL: '  ' })).toBe(false);
  });

  it('accepts a fully configured isolated auth environment', () => {
    expect(isAuthConfigured(configuredEnvironment)).toBe(true);
  });
});
