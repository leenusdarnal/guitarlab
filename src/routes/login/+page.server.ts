import type { PageServerLoad } from './$types';
import { isAuthConfigured } from '../../lib/server/auth';

export const load: PageServerLoad = ({ platform, request }) => {
  const env = platform?.env;
  if (request.headers.get('x-guitarlab-auth-test') === '1') {
    console.info('[auth-test] local configuration flags', {
      platform: Boolean(platform),
      authDb: Boolean(env?.AUTH_DB),
      secret: Boolean(env?.BETTER_AUTH_SECRET?.trim()),
      baseUrl: Boolean(env?.BETTER_AUTH_URL?.trim()),
      resendKey: Boolean(env?.RESEND_API_KEY?.trim()),
      sender: Boolean(env?.AUTH_FROM_EMAIL?.trim()),
      testSink: Boolean(env?.AUTH_TEST_MAIL_SINK_URL),
      configured: isAuthConfigured(env)
    });
  }

  return { authAvailable: isAuthConfigured(env) };
};
