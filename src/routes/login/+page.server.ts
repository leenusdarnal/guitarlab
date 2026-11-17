import type { PageServerLoad } from './$types';
import { isAuthConfigured } from '#lib/server/auth';

export const load: PageServerLoad = ({ platform }) => ({
  authAvailable: isAuthConfigured(platform?.env)
});
