import { env, waitUntil } from 'cloudflare:workers';
import type { RequestHandler } from './$types';
import { accountProfileUpdateSchema } from '../../../../lib/domain/profile/account-profile';
import {
  createAuth,
  isAuthConfigured,
  type AuthEnvironment
} from '../../../../lib/server/auth';

function jsonError(code: string, status: number): Response {
  return Response.json(
    { error: { code } },
    { status, headers: { 'Cache-Control': 'private, no-store' } }
  );
}

export const PATCH: RequestHandler = async ({ request, locals }) => {
  const authEnv = env as unknown as AuthEnvironment;
  if (
    !locals.authUser ||
    !locals.authSession ||
    !isAuthConfigured(authEnv)
  ) {
    return jsonError('UNAUTHENTICATED', 401);
  }

  const expectedOrigin = new URL(authEnv.BETTER_AUTH_URL!).origin;
  if (request.headers.get('origin') !== expectedOrigin) {
    return jsonError('UNTRUSTED_ORIGIN', 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('INVALID_REQUEST', 400);
  }

  const parsed = accountProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('INVALID_PROFILE', 400);
  }

  try {
    const auth = createAuth(authEnv, waitUntil);
    await auth.api.updateUser({
      body: parsed.data,
      headers: request.headers
    });

    return Response.json(
      { success: true },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch {
    return jsonError('PROFILE_UPDATE_FAILED', 500);
  }
};
