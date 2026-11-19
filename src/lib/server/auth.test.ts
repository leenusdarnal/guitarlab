import { describe, expect, it, vi } from 'vitest';
import { isAuthConfigured, sendTransactionalEmail } from './auth';

const configuredEnvironment = {
  AUTH_DB: {} as D1Database,
  BETTER_AUTH_SECRET: 'a'.repeat(48),
  BETTER_AUTH_URL: 'https://guitarlab.example',
  RESEND_API_KEY: 're_test_placeholder',
  AUTH_FROM_EMAIL: 'GuitarLab <auth@guitarlab.example>'
};

describe('isAuthConfigured', () => {
  it('fails closed when the dedicated auth database is absent', () => {
    expect(
      isAuthConfigured({ ...configuredEnvironment, AUTH_DB: undefined })
    ).toBe(false);
  });

  it('requires a high-entropy secret', () => {
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_SECRET: 'too-short'
      })
    ).toBe(false);
  });

  it('requires HTTPS for public origins and allows HTTP only for local development', () => {
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_URL: 'guitarlab.example'
      })
    ).toBe(false);
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_URL: 'http://guitarlab.example'
      })
    ).toBe(false);
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_URL: 'https://guitarlab.example/path'
      })
    ).toBe(false);
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_URL: 'http://localhost:8787'
      })
    ).toBe(true);
  });

  it('requires a transactional email provider and sender', () => {
    expect(
      isAuthConfigured({ ...configuredEnvironment, RESEND_API_KEY: undefined })
    ).toBe(false);
    expect(
      isAuthConfigured({ ...configuredEnvironment, AUTH_FROM_EMAIL: '  ' })
    ).toBe(false);
  });

  it('accepts a fully configured isolated auth environment', () => {
    expect(isAuthConfigured(configuredEnvironment)).toBe(true);
  });

  it('allows bounded short-lived timing overrides only with a loopback mail sink', () => {
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_URL: 'https://localhost:8787',
        AUTH_TEST_MAIL_SINK_URL: 'http://127.0.0.1:4555/emails',
        AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
        AUTH_TEST_SESSION_UPDATE_AGE_SECONDS: '2',
        AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS: '2'
      })
    ).toBe(true);
  });

  it('rejects test timing overrides for non-local origins or without a loopback sink', () => {
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
        AUTH_TEST_SESSION_UPDATE_AGE_SECONDS: '2'
      })
    ).toBe(false);

    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
        AUTH_TEST_MAIL_SINK_URL: 'http://127.0.0.1:4555/emails'
      })
    ).toBe(false);
  });

  it('rejects out-of-range or internally inconsistent test timing overrides', () => {
    const localTestEnvironment = {
      ...configuredEnvironment,
      BETTER_AUTH_URL: 'http://localhost:8787',
      AUTH_TEST_MAIL_SINK_URL: 'http://127.0.0.1:4555/emails'
    };

    expect(
      isAuthConfigured({
        ...localTestEnvironment,
        AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '0'
      })
    ).toBe(false);
    expect(
      isAuthConfigured({
        ...localTestEnvironment,
        AUTH_TEST_SESSION_EXPIRES_IN_SECONDS: '12',
        AUTH_TEST_SESSION_UPDATE_AGE_SECONDS: '12'
      })
    ).toBe(false);
    expect(
      isAuthConfigured({
        ...localTestEnvironment,
        AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS: '61'
      })
    ).toBe(false);
  });
});

describe('test-only transactional email delivery', () => {
  it('delivers test messages only to an explicitly configured loopback sink', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 202 }));
    const message = {
      to: 'learner@example.test',
      subject: 'Verify your GuitarLab email',
      text: 'Use this one-time link: http://localhost:8787/verify?token=test-token'
    };
    const environment = {
      ...configuredEnvironment,
      BETTER_AUTH_URL: 'http://localhost:8787',
      AUTH_TEST_MAIL_SINK_URL: 'http://127.0.0.1:4555/emails'
    };

    await sendTransactionalEmail(environment, message, fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('http://127.0.0.1:4555/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'GuitarLab <auth@guitarlab.example>',
        to: ['learner@example.test'],
        subject: 'Verify your GuitarLab email',
        text: 'Use this one-time link: http://localhost:8787/verify?token=test-token'
      })
    });
  });

  it('rejects a test mail sink outside loopback before making a network request', async () => {
    const fetcher = vi.fn();

    await expect(
      sendTransactionalEmail(
        {
          ...configuredEnvironment,
          BETTER_AUTH_URL: 'http://localhost:8787',
          AUTH_TEST_MAIL_SINK_URL: 'https://mail.example.test/capture'
        },
        {
          to: 'learner@example.test',
          subject: 'Reset',
          text: 'One-time link'
        },
        fetcher
      )
    ).rejects.toThrow('Test email sink must use a loopback HTTP address.');

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('accepts a loopback test sink for a local authentication origin', () => {
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        BETTER_AUTH_URL: 'http://localhost:8787',
        AUTH_TEST_MAIL_SINK_URL: 'http://127.0.0.1:4555/emails'
      })
    ).toBe(true);
  });

  it('keeps test mail delivery unavailable for non-local authentication origins', () => {
    expect(
      isAuthConfigured({
        ...configuredEnvironment,
        AUTH_TEST_MAIL_SINK_URL: 'http://127.0.0.1:4555/emails'
      })
    ).toBe(false);
  });
});
