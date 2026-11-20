import { env } from 'cloudflare:workers';
import type { PageServerLoad } from './$types';
import { isAuthConfigured, isEmailPasswordAuthConfigured, type AuthEnvironment } from '../../lib/server/auth';

export const load: PageServerLoad = () => ({
  authAvailable: isAuthConfigured(env as unknown as AuthEnvironment),
  emailPasswordAvailable: isEmailPasswordAuthConfigured(env as unknown as AuthEnvironment)
});
