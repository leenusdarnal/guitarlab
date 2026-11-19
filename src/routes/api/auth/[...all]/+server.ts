import type { RequestHandler } from './$types';
import { createAuth, isAuthConfigured } from '../../../../lib/server/auth';

function unavailable(): Response {
  return Response.json(
    {
      error: {
        code: 'AUTH_NOT_CONFIGURED',
        message: 'Account access is not configured in this environment.'
      }
    },
    {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store' }
    }
  );
}

async function handle({ request, platform }: Parameters<RequestHandler>[0]) {
  const env = platform?.env;
  if (!env || !isAuthConfigured(env)) return unavailable();

  const waitUntil = platform?.context?.waitUntil?.bind(platform.context);
  const auth = createAuth(env, waitUntil);
  return auth.handler(request);
}

export const GET: RequestHandler = handle;
export const POST: RequestHandler = handle;
