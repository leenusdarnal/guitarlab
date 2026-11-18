import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, setHeaders }) => {
  // The signed-out dashboard renders no account-specific server data. The
  // shared server hook overrides this with private, no-store when signed in.
  if (!locals.authUser) {
    setHeaders({ 'Cache-Control': 'public, max-age=0, must-revalidate' });
  }
};
