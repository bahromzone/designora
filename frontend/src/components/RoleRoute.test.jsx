import { describe, expect, it } from "vitest";

import { canAccess } from "./RoleRoute";

const ADMIN_ROLES = ["admin", "superadmin"];

describe("canAccess", () => {
  it("login qilmagan foydalanuvchini kiritmaydi", () => {
    expect(canAccess(null, ADMIN_ROLES)).toBe(false);
    expect(canAccess(undefined, ADMIN_ROLES)).toBe(false);
  });

  it("oddiy user va instructorni admin panelga kiritmaydi", () => {
    expect(canAccess({ role: "user" }, ADMIN_ROLES)).toBe(false);
    expect(canAccess({ role: "instructor" }, ADMIN_ROLES)).toBe(false);
  });

  it("admin va superadminni kiritadi", () => {
    expect(canAccess({ role: "admin" }, ADMIN_ROLES)).toBe(true);
    expect(canAccess({ role: "superadmin" }, ADMIN_ROLES)).toBe(true);
  });

  it("superadmin-only sahifaga adminni kiritmaydi", () => {
    expect(canAccess({ role: "admin" }, ["superadmin"])).toBe(false);
    expect(canAccess({ role: "superadmin" }, ["superadmin"])).toBe(true);
  });

  it("rol ro'yxati bo'sh bo'lsa har qanday login qilgan userga ruxsat beradi", () => {
    expect(canAccess({ role: "user" })).toBe(true);
  });
});
