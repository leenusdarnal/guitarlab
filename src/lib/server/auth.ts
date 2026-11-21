import { betterAuth } from 'better-auth';

export interface AuthEnvironment {
  AUTH_DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  /** Local-only timing overrides used to exercise session expiry and refresh. */
  AUTH_TEST_SESSION_EXPIRES_IN_SECONDS?: string;
  AUTH_TEST_SESSION_UPDATE_AGE_SECONDS?: string;
}

export type WaitUntil = (promise: Promise<unknown>) => void;

function parseTestSeconds(value: string | undefined): number | null | undefined {
  if (value === undefined) return undefined;
  if (!/^[1-9]\\d*$/.test(value)) return null;
  const seconds = Number(value);
  return Number.isSafeInteger(seconds) && seconds <= 60 ? seconds : null;
}

function testTimingConfigurationIsValid(env: AuthEnvironment, isLocal: boolean): boolean {
  const expires = parseTestSeconds(env.AUTH_TEST_SESSION_EXPIRES_IN_SECONDS);
  const updateAge = parseTestSeconds(env.AUTH_TEST_SESSION_UPDATE_AGE_SECONDS);
  if (expires === null || updateAge === null) return false;
  const hasOverrides = expires !== undefined || updateAge !== undefined;
  if (!hasOverrides) return true;
  if (!isLocal) return false;
  const effectiveExpires = expires ?? 60 * 60 * 24 * 30;
  const effectiveUpdateAge = updateAge ?? 60 * 60 * 24;
  return effectiveUpdateAge < effectiveExpires;
}

function authTiming(env: AuthEnvironment) {
  return {
    sessionExpiresIn: Number(env.AUTH_TEST_SESSION_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 30),
    sessionUpdateAge: Number(env.AUTH_TEST_SESSION_UPDATE_AGE_SECONDS ?? 60 * 60 * 24)
  };
}

export function isAuthConfigured(env?: AuthEnvironment): boolean {
  if (
    !env?.AUTH_DB ||
    !env.BETTER_AUTH_SECRET ||
    env.BETTER_AUTH_SECRET.length < 32 ||
    !env.BETTER_AUTH_URL ||
    (!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) &&
      !(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET))
  ) return false;

  try {
    const url = new URL(env.BETTER_AUTH_URL);
    const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    const validOrigin =
      (url.protocol === 'https:' || (url.protocol === 'http:' && isLocal)) &&
      url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password;
    return validOrigin && testTimingConfigurationIsValid(env, isLocal);
  } catch {
    return false;
  }
}

/** Construct Better Auth only when its isolated D1, secret, URL, and OAuth provider are configured. */
export function createAuth(env: AuthEnvironment, waitUntil?: WaitUntil) {\n  void waitUntil;
  if (!isAuthConfigured(env)) {
    throw new Error('Authentication is not configured for this environment.');
  }

  const baseUrl = new URL(env.BETTER_AUTH_URL!);
  const secureCookies = baseUrl.protocol === 'https:';
  const timing = authTiming(env);

  return betterAuth({
    appName: 'GuitarLab',
    baseURL: baseUrl.origin,
    secret: env.BETTER_AUTH_SECRET,
    database: env.AUTH_DB,
    trustedOrigins: [baseUrl.origin],
    telemetry: { enabled: false },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET ? {
        google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET }
      } : {}),
      ...(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET ? {
        github: { clientId: env.GITHUB_CLIENT_ID, clientSecret: env.GITHUB_CLIENT_SECRET }
      } : {})
    },
    session: {
      expiresIn: timing.sessionExpiresIn,
      updateAge: timing.sessionUpdateAge
    },
    rateLimit: {
      enabled: true,
      storage: 'database',
      modelName: 'rateLimit',
      window: 60,
      max: 60
    },
    advanced: {
      useSecureCookies: secureCookies,
      defaultCookieAttributes: {
        httpOnly: true,
        secure: secureCookies,
        sameSite: 'lax',
        path: '/'
      },
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
      database: { generateId: 'uuid' }
    }
  });
}
