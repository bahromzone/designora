import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("3.30 performance foundation", () => {
  it("splits route modules and enforces bundle budgets", () => {
    const app = readFileSync("src/App.jsx", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(app).toContain("lazy(() => import(");
    expect(app).toContain("<Suspense");
    expect(pkg.scripts["performance:check"]).toBeTruthy();
  });
});
