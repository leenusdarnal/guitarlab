import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
  if (!locals.authUser) {
    redirect(303, '/login');
  }

  return {
    account: {
      name: locals.authUser.name,
      email: locals.authUser.email,
      emailVerified: locals.authUser.emailVerified
    }
  };
};
