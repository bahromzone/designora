import { expect, it } from "vitest";

import {
  adjacentLessons,
  flattenLessons,
  lessonFeatures,
  lessonStatus,
} from "./lessonSidebarLogic";

const modules = [
  { id: 1, title: "Asoslar", lessons: [{ id: 1, is_completed: true }, { id: 2 }] },
  { id: 2, title: "Amaliyot", lessons: [{ id: 3, is_locked: true }, { id: 4 }] },
];

it("flattens modules and finds unlocked adjacent lessons", () => {
  expect(flattenLessons(modules)).toHaveLength(4);
  expect(adjacentLessons(modules, 2).previous.id).toBe(1);
  expect(adjacentLessons(modules, 2).next.id).toBe(4);
});

it("maps lesson state and feature badges", () => {
  expect(lessonStatus({ id: 2 }, 2)).toBe("current");
  expect(lessonStatus({ id: 3, is_locked: true }, 2)).toBe("locked");
  expect(lessonStatus({ id: 1, is_completed: true }, 2)).toBe("completed");
  expect(lessonFeatures(2, [{ lesson_id: 2 }], [{ lesson_id: 2 }])).toEqual({
    assignment: true,
    quiz: true,
  });
});
