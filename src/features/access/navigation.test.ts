import { describe, expect, it } from "vitest";
import { accountNavigation, homePathFor, navigationFor } from "./navigation";

describe("navigation", () => {
  it("sends each persona to its own home", () => {
    expect(homePathFor("admin")).toBe("/app/admin");
    expect(homePathFor("teacher")).toBe("/app/teacher");
    expect(homePathFor("student")).toBe("/app/student");
    expect(homePathFor("unscoped")).toBe("/app/pending");
  });

  it("shows only account pages before a persona is known", () => {
    expect(accountNavigation().map((item) => item.to)).toEqual([
      "/app/profile",
      "/app/profile/password",
    ]);
  });

  it("does not show administrator navigation to a teacher", () => {
    const destinations = navigationFor("teacher").map((item) => item.to);
    expect(destinations).toContain("/app/teacher");
    expect(destinations).toContain("/app/students");
    expect(destinations).not.toContain("/app/admin");
    expect(destinations).not.toContain("/app/student");
  });

  it("shows a student their own record and not the administrator home", () => {
    const labels = navigationFor("student").map((item) => item.label);
    expect(labels).toContain("My record");
    expect(labels).not.toContain("Students");
    expect(navigationFor("admin").map((item) => item.label)).toContain("Students");
    expect(navigationFor("unscoped").map((item) => item.to)).not.toContain("/app/students");
  });

  it("limits an unscoped user to home, profile, and password", () => {
    expect(navigationFor("unscoped").map((item) => item.label)).toEqual([
      "Home",
      "Profile",
      "Password",
    ]);
  });
});
