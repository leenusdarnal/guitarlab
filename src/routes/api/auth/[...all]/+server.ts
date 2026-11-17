import type { RequestHandler } from './$types';

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
      headers: { 'Cache-Control': 'no-store' }
    }
  );
}

export const GET: RequestHandler = () => unavailable();
export const POST: RequestHandler = () => unavailable();
