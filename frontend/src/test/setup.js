// Vitest umumiy sozlamalari — har testdan oldin yuklanadi.
import "@testing-library/jest-dom";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Har testdan keyin DOM'ni tozalash
afterEach(() => {
  cleanup();
});

// GSAP + ScrollTrigger jsdom'da ishlamaydi — mock qilamiz.
// Komponentlar animatsiyasiz ham to'g'ri render bo'lishini tekshiramiz.
vi.mock("gsap", () => {
  const tween = { kill: () => {} };
  const gsap = {
    registerPlugin: () => {},
    context: (fn) => {
      if (typeof fn === "function") fn();
      return { revert: () => {} };
    },
    fromTo: () => tween,
    to: () => tween,
    from: () => tween,
    set: () => {},
    timeline: () => ({
      to: () => ({}),
      from: () => ({}),
      fromTo: () => ({}),
    }),
  };
  return { default: gsap, gsap };
});

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { create: () => {}, refresh: () => {}, kill: () => {} },
}));

// window.matchMedia stub (ba'zi UI kutubxonalari uchun)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
