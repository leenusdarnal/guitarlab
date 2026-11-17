import { building } from '$app/env';
import type { Handle } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { createAuth, isAuthConfigured } from './lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  let response: Response;
  const env = event.platform?.env;

  if (!building && env && isAuthConfigured(env)) {
    const waitUntil = event.platform?.context?.waitUntil?.bind(
      event.platform.context
    );
    const auth = createAuth(env, waitUntil);
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
