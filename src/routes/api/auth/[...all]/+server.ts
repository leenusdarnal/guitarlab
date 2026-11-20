import { env, waitUntil } from 'cloudflare:workers';
import type { RequestHandler } from './$types';
import {
  createAuth,
  isAuthConfigured,
  type AuthEnvironment
} from '../../../../lib/server/auth';

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

async function handle({ request }: Parameters<RequestHandler>[0]) {
  const authEnv = env as unknown as AuthEnvironment;
  if (!isAuthConfigured(authEnv)) return unavailable();

  const auth = createAuth(authEnv, waitUntil);
  return auth.handler(request);
}

export const GET: RequestHandler = handle;
export const POST: RequestHandler = handle;
