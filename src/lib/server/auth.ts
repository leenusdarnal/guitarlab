import { betterAuth } from 'better-auth';

export interface AuthEnvironment {
  AUTH_DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  RESEND_API_KEY?: string;
  AUTH_FROM_EMAIL?: string;
}

export type WaitUntil = (promise: Promise<unknown>) => void;

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

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
    const isLocalDevelopmentHost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      url.hostname === '[::1]';

    return (
      (url.protocol === 'https:' || (url.protocol === 'http:' && isLocalDevelopmentHost)) &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}

async function sendTransactionalEmail(
  env: AuthEnvironment,
  message: { to: string; subject: string; text: string }
): Promise<void> {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
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
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: ({ user, url }) =>
        queueEmail({
          to: user.email,
          subject: 'Reset your GuitarLab password',
          text: `Use this one-time link to reset your GuitarLab password:

${url}

If you did not request a reset, you can ignore this email.`
        })
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
