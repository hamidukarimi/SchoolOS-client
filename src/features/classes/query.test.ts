import { describe, expect, it } from "vitest";
import {
  canManageClasses,
  classListIntroduction,
  showsClassSearch,
  teacherChoices,
} from "./display";
import { classListSearch, parseClassListQuery } from "./query";
import { classFormSchema, toClassWritePayload } from "./schemas";

const form = {
  name: "Grade 6",
  section: "A",
  grade: "6",
  academicYear: "2026",
  capacity: "30",
  teacherId: "",
  status: "active" as const,
};

describe("class list query", () => {
  it("keeps search, exact grade and year filters, and status", () => {
    const query = parseClassListQuery(
      new URLSearchParams("search= grade &status=inactive&grade=6&academicYear=2026&page=2"),
    );
    expect(query).toEqual({
      search: "grade",
      status: "inactive",
      grade: "6",
      academicYear: "2026",
      page: 2,
    });
    expect(classListSearch(query)).toBe("?search=grade&status=inactive&grade=6&academicYear=2026&page=2");
  });

  it("drops a teacher status and an invalid page", () => {
    expect(parseClassListQuery(new URLSearchParams("status=suspended&page=0"))).toEqual({
      search: "",
      status: "",
      grade: "",
      academicYear: "",
      page: 1,
    });
  });
});

describe("class form", () => {
  it("requires a capacity of at least 1 and omits a blank teacher", () => {
    expect(classFormSchema.shape.capacity.safeParse("0").success).toBe(false);
    expect(toClassWritePayload(form)).toEqual({
      name: "Grade 6",
      section: "A",
      grade: "6",
      academicYear: "2026",
      capacity: 30,
      status: "active",
    });
  });

  it("sends a selected teacher id", () => {
    expect(toClassWritePayload({ ...form, teacherId: "teacher-1" }).teacherId).toBe("teacher-1");
  });
});

describe("class access", () => {
  it("lets only an administrator manage classes", () => {
    expect(canManageClasses("admin")).toBe(true);
    expect(canManageClasses("teacher")).toBe(false);
    expect(canManageClasses("student")).toBe(false);
  });

  it("hides name search from a student because the class list replaces that filter", () => {
    expect(showsClassSearch("admin")).toBe(true);
    expect(showsClassSearch("teacher")).toBe(true);
    expect(showsClassSearch("student")).toBe(false);
  });

  it("describes teacher and student class scope", () => {
    expect(classListIntroduction("teacher")).toMatch(/assigned teacher/);
    expect(classListIntroduction("student")).toMatch(/linked to your student profile/);
    expect(classListIntroduction("admin")).toMatch(/does not enroll students/);
  });

  it("keeps the saved teacher available when that teacher is outside the current search", () => {
    const choices = teacherChoices(
      [{ id: "teacher-2", teacherId: "TCH-2", firstName: "Laila", lastName: "Noori", subject: "" }],
      { id: "teacher-1", teacherId: "TCH-1", firstName: "Karim", lastName: "Rahimi", subject: "Mathematics" },
    );
    expect(choices[0]?.id).toBe("teacher-1");
    expect(choices.map((choice) => choice.id)).toEqual(["teacher-1", "teacher-2"]);
  });
});
