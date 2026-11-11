import type { PageServerLoad } from './$types';
import { getCurriculumStats, listCurriculumRoutes } from '../../lib/server/curriculum/catalog';

export const load: PageServerLoad = () => ({
  routes: listCurriculumRoutes(),
  stats: getCurriculumStats()
});
