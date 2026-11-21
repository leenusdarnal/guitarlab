import { env } from 'cloudflare:workers';
import type { PageServerLoad } from './$types';
import { isAuthConfigured, type AuthEnvironment } from '../../lib/server/auth';

export const load: PageServerLoad = () => {
  const authEnv = env as unknown as AuthEnvironment;
  return {
    authAvailable: isAuthConfigured(authEnv),
    googleAvailable: Boolean(authEnv.GOOGLE_CLIENT_ID && authEnv.GOOGLE_CLIENT_SECRET),
    githubAvailable: Boolean(authEnv.GITHUB_CLIENT_ID && authEnv.GITHUB_CLIENT_SECRET)
  };
};
