import type { PageServerLoad } from './$types';
import { getCurriculumStats, listCurriculumRoutes } from '../../lib/server/curriculum/catalog';

export const load: PageServerLoad = ({ setHeaders }) => {
  // This route contains only authored public curriculum metadata.
  setHeaders({ 'cache-control': 'public, max-age=0, must-revalidate' });
  return {
    routes: listCurriculumRoutes(),
    stats: getCurriculumStats()
  };
};
