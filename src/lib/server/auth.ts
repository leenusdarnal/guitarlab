import { betterAuth } from 'better-auth';

export interface AuthEnvironment {
  AUTH_DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  RESEND_API_KEY?: string;
  AUTH_FROM_EMAIL?: string;
  /** Local-only override used by automated account lifecycle acceptance. */
  AUTH_TEST_MAIL_SINK_URL?: string;
  /** Local-only timing overrides used to exercise expiry and refresh quickly. */
  AUTH_TEST_SESSION_EXPIRES_IN_SECONDS?: string;
  AUTH_TEST_SESSION_UPDATE_AGE_SECONDS?: string;
  AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS?: string;
}

export type WaitUntil = (promise: Promise<unknown>) => void;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

function isLoopbackHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash
    );
  } catch {
    return false;
  }
}

function parseTestSeconds(
  value: string | undefined
): number | null | undefined {
  if (value === undefined) return undefined;
  if (!/^[1-9]\d*$/.test(value)) return null;

  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds <= 60 ? seconds : null;
}

function testTimingConfigurationIsValid(
  env: AuthEnvironment,
  isLocalDevelopmentHost: boolean
): boolean {
  const sessionExpiresIn = parseTestSeconds(
    env.AUTH_TEST_SESSION_EXPIRES_IN_SECONDS
  );
  const sessionUpdateAge = parseTestSeconds(
    env.AUTH_TEST_SESSION_UPDATE_AGE_SECONDS
  );
  const resetTokenExpiresIn = parseTestSeconds(
    env.AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS
  );
  const parsedValues = [
    sessionExpiresIn,
    sessionUpdateAge,
    resetTokenExpiresIn
  ];
  if (parsedValues.some((value) => value === null)) return false;

  const hasOverrides = [
    env.AUTH_TEST_SESSION_EXPIRES_IN_SECONDS,
    env.AUTH_TEST_SESSION_UPDATE_AGE_SECONDS,
    env.AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS
  ].some((value) => value !== undefined);

  if (!hasOverrides) return true;

  if (
    !isLocalDevelopmentHost ||
    !env.AUTH_TEST_MAIL_SINK_URL ||
    !isLoopbackHttpUrl(env.AUTH_TEST_MAIL_SINK_URL)
  ) {
    return false;
  }

  const effectiveSessionExpiresIn = sessionExpiresIn ?? 60 * 60 * 24 * 30;
  const effectiveSessionUpdateAge = sessionUpdateAge ?? 60 * 60 * 24;
  if (effectiveSessionUpdateAge >= effectiveSessionExpiresIn) {
    return false;
  }

  return true;
}

function authTiming(env: AuthEnvironment) {
  return {
    sessionExpiresIn: Number(
      env.AUTH_TEST_SESSION_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 30
    ),
    sessionUpdateAge: Number(
      env.AUTH_TEST_SESSION_UPDATE_AGE_SECONDS ?? 60 * 60 * 24
    ),
    resetTokenExpiresIn: Number(
      env.AUTH_TEST_RESET_TOKEN_EXPIRES_IN_SECONDS ?? 60 * 60
    )
  };
}

export function isAuthConfigured(env?: AuthEnvironment): boolean {
  if (
    !env?.AUTH_DB ||
    !env.BETTER_AUTH_SECRET ||
    env.BETTER_AUTH_SECRET.length < 32 ||
    !env.BETTER_AUTH_URL ||
    !env.RESEND_API_KEY ||
    !env.AUTH_FROM_EMAIL?.trim()
  ) {
    return false;
  }

  try {
    const url = new URL(env.BETTER_AUTH_URL);
    const isLocalDevelopmentHost = ['localhost', '127.0.0.1', '[::1]'].includes(
      url.hostname
    );
    const validOrigin =
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' && isLocalDevelopmentHost)) &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password;

    if (!validOrigin) return false;
    if (!testTimingConfigurationIsValid(env, isLocalDevelopmentHost)) {
      return false;
    }
    if (
      env.AUTH_TEST_MAIL_SINK_URL &&
      (!isLocalDevelopmentHost ||
        !isLoopbackHttpUrl(env.AUTH_TEST_MAIL_SINK_URL))
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function sendTransactionalEmail(
  env: AuthEnvironment,
  message: { to: string; subject: string; text: string },
  fetcher: typeof fetch = fetch
): Promise<void> {
  const testSink = env.AUTH_TEST_MAIL_SINK_URL;
  if (
    testSink &&
    (!env.BETTER_AUTH_URL ||
      !isLoopbackHttpUrl(testSink) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(
        new URL(env.BETTER_AUTH_URL).hostname
      ))
  ) {
    throw new Error('Test email sink must use a loopback HTTP address.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (!testSink) {
    headers.Authorization = `Bearer ${env.RESEND_API_KEY}`;
  }

  const response = await fetcher(testSink ?? RESEND_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      from: env.AUTH_FROM_EMAIL,
      to: [message.to],
      subject: message.subject,
      text: message.text
    })
  });

  if (!response.ok) {
    // Do not include provider response bodies, addresses, or tokens in logs.
    throw new Error('Transactional email delivery failed.');
  }
}

/**
 * Construct Better Auth from the request's Cloudflare bindings. Auth is not
 * instantiated unless its isolated D1 database, secret, public URL and email
 * delivery configuration are all present.
 */
export function createAuth(env: AuthEnvironment, waitUntil?: WaitUntil) {
  if (!isAuthConfigured(env)) {
    throw new Error('Authentication is not configured for this environment.');
  }

  const baseUrl = new URL(env.BETTER_AUTH_URL!);
  const secureCookies = baseUrl.protocol === 'https:';
  const timing = authTiming(env);

  const queueEmail = (message: {
    to: string;
    subject: string;
    text: string;
  }) => {
    const delivery = sendTransactionalEmail(env, message);
    if (waitUntil) {
      waitUntil(delivery);
      return Promise.resolve();
    }
    return delivery;
  };

  return betterAuth({
    appName: 'GuitarLab',
    baseURL: baseUrl.origin,
    secret: env.BETTER_AUTH_SECRET,
    database: env.AUTH_DB,
    trustedOrigins: [baseUrl.origin],
    telemetry: { enabled: false },
    session: {
      expiresIn: timing.sessionExpiresIn,
      updateAge: timing.sessionUpdateAge
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      resetPasswordTokenExpiresIn: timing.resetTokenExpiresIn,
      sendResetPassword: ({ user, token }) => {
        const resetUrl = new URL('/login', baseUrl);
        resetUrl.searchParams.set('mode', 'reset');
        resetUrl.searchParams.set('token', token);
        return queueEmail({
          to: user.email,
          subject: 'Reset your GuitarLab password',
          text: `Use this one-time link to reset your GuitarLab password:

${resetUrl.toString()}

If you did not request a reset, you can ignore this email.`
        });
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      expiresIn: 60 * 60,
      sendVerificationEmail: ({ user, url }) =>
        queueEmail({
          to: user.email,
          subject: 'Verify your GuitarLab email',
          text: `Welcome to GuitarLab. Verify your email address using this link:

${url}

The link expires in one hour.`
        })
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'rateLimit',
      window: 60,
      max: 60,
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
        '/send-verification-email': { window: 60, max: 3 },
        '/request-password-reset': { window: 60, max: 3 }
      }
    },
    advanced: {
      useSecureCookies: secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: 'lax',
        path: '/'
      },
      ipAddress: {
        ipAddressHeaders: ['cf-connecting-ip']
      },
      database: {
        generateId: 'uuid'
      }
    }
  });
}
