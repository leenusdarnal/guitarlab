import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findCurriculumLesson, type CurriculumWeek } from '../../../lib/server/curriculum/catalog';

export const load: PageServerLoad = ({ params }) => {
  const detail = findCurriculumLesson(params.lessonId);
  if (!detail) {
    error(404, {
      message: 'This lesson could not be found in the current authored curriculum.'
    });
  }

  const index = detail.route.weeks.findIndex((week: CurriculumWeek) => week.lessonId === detail.lesson.id);
  return {
    detail,
    previousLessonId: index > 0 ? detail.route.weeks[index - 1].lessonId : null,
    nextLessonId:
      index >= 0 && index < detail.route.weeks.length - 1
        ? detail.route.weeks[index + 1].lessonId
        : null
  };
};
