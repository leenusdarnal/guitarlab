import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);
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
