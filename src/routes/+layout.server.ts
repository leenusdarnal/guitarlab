import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
  account: locals.authUser
    ? {
        name: locals.authUser.name,
        email: locals.authUser.email,
        emailVerified: locals.authUser.emailVerified
      }
    : null
});
