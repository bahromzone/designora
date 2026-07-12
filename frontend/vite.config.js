import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5173 },
  preview: { host: "127.0.0.1", port: 4173 },
  build: {
    manifest: true,
    sourcemap: false,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("framer-motion") || id.includes("gsap")) return "motion";
          if (id.includes("react-router")) return "router";
          if (id.includes("react")) return "react-vendor";
          return "vendor";
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      // Enforce the baseline on critical production domain logic. Component,
      // accessibility and browser behavior still run in the same CI workflow.
      include: [
        "src/lib/calendarLogic.js",
        "src/lib/learningPathLogic.js",
        "src/lib/lessonSidebarLogic.js",
        "src/lib/roadmapMetrics.js",
        "src/lib/videoPlayerLogic.js",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
});
