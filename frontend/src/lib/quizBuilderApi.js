import { request } from "./request";

export const quizBuilderApi = {
  list: (courseId) => request(`/api/quiz/courses/${courseId}/quizzes`),
  create: (courseId, body) =>
    request(`/api/quiz/courses/${courseId}/quizzes`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  manage: (quizId) => request(`/api/quiz/quizzes/${quizId}/manage`),
  update: (quizId, body) =>
    request(`/api/quiz/quizzes/${quizId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (quizId) =>
    request(`/api/quiz/quizzes/${quizId}`, { method: "DELETE" }),
  addQuestion: (quizId, body) =>
    request(`/api/quiz/quizzes/${quizId}/questions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateQuestion: (questionId, body) =>
    request(`/api/quiz/questions/${questionId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  removeQuestion: (questionId) =>
    request(`/api/quiz/questions/${questionId}`, { method: "DELETE" }),
};
