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

  it("shows a teacher their own teaching record and not every teacher", () => {
    const labels = navigationFor("teacher").map((item) => item.label);
    expect(labels).toContain("Teaching record");
    expect(labels).toContain("Students");
    expect(labels).toContain("Classes");
    expect(labels).not.toContain("Teachers");
    expect(navigationFor("teacher").map((item) => item.to)).not.toContain("/app/admin");
  });

  it("shows class teachers to a student and the full section to an administrator", () => {
    expect(navigationFor("student").map((item) => item.label)).toEqual(
      expect.arrayContaining(["My record", "Teachers"]),
    );
    expect(navigationFor("student").map((item) => item.label)).not.toContain("Students");
    expect(navigationFor("admin").map((item) => item.label)).toEqual(
      expect.arrayContaining(["Students", "Teachers", "Classes", "Enrollment"]),
    );
    expect(navigationFor("teacher").map((item) => item.label)).not.toContain("Enrollment");
    expect(navigationFor("student").map((item) => item.label)).not.toContain("Enrollment");
    expect(navigationFor("student").map((item) => item.label)).toContain("Classes");
    expect(navigationFor("unscoped").map((item) => item.to)).not.toContain("/app/teachers");
    expect(navigationFor("unscoped").map((item) => item.to)).not.toContain("/app/classes");
  });

  it("limits an unscoped user to home, profile, and password", () => {
    expect(navigationFor("unscoped").map((item) => item.label)).toEqual([
      "Home",
      "Profile",
      "Password",
    ]);
  });
});
