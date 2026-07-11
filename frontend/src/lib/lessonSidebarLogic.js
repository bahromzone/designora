export function flattenLessons(modules = []) {
  return modules.flatMap((module) =>
    (module.lessons || []).map((lesson) => ({
      ...lesson,
      moduleId: module.id,
      moduleTitle: module.title,
    })),
  );
}

export function adjacentLessons(modules, activeId) {
  const lessons = flattenLessons(modules);
  const index = lessons.findIndex((lesson) => lesson.id === activeId);
  if (index < 0) return { previous: null, next: null };
  const previous = [...lessons.slice(0, index)].reverse().find((lesson) => !lesson.is_locked) || null;
  const next = lessons.slice(index + 1).find((lesson) => !lesson.is_locked) || null;
  return { previous, next };
}

export function lessonStatus(lesson, activeId) {
  if (lesson.id === activeId) return "current";
  if (lesson.is_locked) return "locked";
  if (lesson.is_completed) return "completed";
  return "available";
}

export function lessonFeatures(lessonId, assignments = [], quizzes = []) {
  return {
    assignment: assignments.some((item) => item.lesson_id === lessonId),
    quiz: quizzes.some((item) => item.lesson_id === lessonId),
  };
}
