import { describe, expect, it } from "vitest";
import { studentClassesKey } from "./api";
import {
  canOpenEnrolledClass,
  enrolledClassesEmptyMessage,
  enrolledClassesPanel,
  enrolledClassTitle,
} from "./display";
import { normalizeEnrolledClasses } from "./normalize";
import type { EnrolledClass } from "./types";

const gradeSix: EnrolledClass = {
  id: "class-6",
  name: "Grade 6",
  section: "A",
  grade: "6",
  academicYear: "2026",
  teacher: { id: "teacher-1", firstName: "Laila", lastName: "Noori", teacherId: "TCH-1" },
};

const science: EnrolledClass = {
  id: "class-science",
  name: "Science",
  section: "B",
  grade: "6",
  academicYear: "2026",
  teacher: { id: "teacher-2", firstName: "Karim", lastName: "Rahim", teacherId: "TCH-2" },
};

describe("normalizeEnrolledClasses", () => {
  it("reads roster classes and ignores a stale classId on the student", () => {
    expect(
      normalizeEnrolledClasses({
        classId: { _id: "stale-class", name: "History", section: "C" },
        classes: [gradeSix, science],
      }),
    ).toEqual([gradeSix, science]);
  });

  it("keeps an empty roster empty", () => {
    expect(normalizeEnrolledClasses({ classes: [] })).toEqual([]);
  });

  it("rejects a response that is not a class list", () => {
    expect(() => normalizeEnrolledClasses({ classes: null })).toThrow(/not valid/);
    expect(() => normalizeEnrolledClasses({ classes: [{ id: "class-6" }] })).toThrow(/not valid/);
  });
});

describe("enrolled class presentation", () => {
  it("shows every enrolled class title", () => {
    expect([gradeSix, science].map(enrolledClassTitle)).toEqual(["Grade 6, section A", "Science, section B"]);
  });

  it("uses an empty state only after a successful empty response", () => {
    expect(enrolledClassesPanel("loading", 0)).toBe("loading");
    expect(enrolledClassesPanel("error", 0)).toBe("error");
    expect(enrolledClassesPanel("ready", 0)).toBe("empty");
    expect(enrolledClassesEmptyMessage).toMatch(/not enrolled/);
    expect(enrolledClassesPanel("ready", 2)).toBe("list");
  });

  it("links a class when the viewer is allowed to open it", () => {
    expect(canOpenEnrolledClass("admin", undefined, science)).toBe(true);
    expect(canOpenEnrolledClass("student", undefined, science)).toBe(true);
    expect(canOpenEnrolledClass("teacher", "teacher-1", gradeSix)).toBe(true);
    expect(canOpenEnrolledClass("teacher", "teacher-1", science)).toBe(false);
  });

  it("uses the classes cache key so enrollment changes refresh the profile", () => {
    expect(studentClassesKey("student-1")[0]).toBe("classes");
  });
});
