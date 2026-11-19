import { building } from '$app/environment';
import { env, waitUntil } from 'cloudflare:workers';
import type { Handle } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import {
  createAuth,
  isAuthConfigured,
  type AuthEnvironment
} from './lib/server/auth';
import { applyPrivateResponseCachePolicy } from './lib/server/response-cache-policy';

export const handle: Handle = async ({ event, resolve }) => {
  let response: Response;
  const authEnv = env as unknown as AuthEnvironment;

  if (!building && isAuthConfigured(authEnv)) {
    const auth = createAuth(authEnv, waitUntil);
    const session = await auth.api.getSession({
      headers: event.request.headers
    });

    event.locals.authUser = session?.user ?? null;
    event.locals.authSession = session?.session ?? null;

    response = await svelteKitHandler({ event, resolve, auth, building });
  } else {
    event.locals.authUser = null;
    event.locals.authSession = null;
    response = await resolve(event);
  }

  const headers = new Headers(response.headers);
  const privatePath =
    /^\/(?:api|account|login|register|signup|verify|password-reset)(?:\/|$)/.test(
      event.url.pathname
    );

  // Authenticated, identity/API, and cookie-setting responses must never be
  // replayed from Cache Storage. Enforce Set-Cookie server-side because the
  // browser may hide that response header from service-worker JavaScript.
  applyPrivateResponseCachePolicy(headers, {
    authenticated: Boolean(event.locals.authUser),
    privatePath
  });

  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=()'
  );
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');

  if (event.url.protocol === 'https:') {
    headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains'
    );
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
};
