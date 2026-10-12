import { describe, expect, it } from "vitest";
import { enrollStudentSchema } from "./schemas";
import {
  availableStudentChoices,
  canSubmitEnrollment,
  enrollStudentBody,
  enrollmentInvalidationKey,
  isClassFull,
} from "./rules";

const students = [
  { id: "student-1", firstName: "Amina", lastName: "Noori", studentId: "STU-1" },
  { id: "student-2", firstName: "Karim", lastName: "Rahimi", studentId: "STU-2" },
];

describe("enrollment rules", () => {
  it("sends only the student id", () => {
    expect(enrollStudentBody("student-1")).toEqual({ studentId: "student-1" });
  });

  it("refreshes class records and not student profile class fields", () => {
    expect(enrollmentInvalidationKey).toEqual(["classes"]);
  });

  it("blocks a full class and a student already on the class list", () => {
    expect(isClassFull(30, 30)).toBe(true);
    expect(isClassFull(29, 30)).toBe(false);
    expect(
      canSubmitEnrollment({
        studentId: "student-1",
        pending: false,
        studentCount: 30,
        capacity: 30,
        enrolledIds: [],
      }),
    ).toBe(false);
    expect(
      canSubmitEnrollment({
        studentId: "student-1",
        pending: false,
        studentCount: 1,
        capacity: 30,
        enrolledIds: ["student-1"],
      }),
    ).toBe(false);
  });

  it("does not treat an inactive class as ineligible and blocks a second submit", () => {
    expect(
      canSubmitEnrollment({
        studentId: "student-2",
        pending: false,
        studentCount: 1,
        capacity: 30,
        enrolledIds: ["student-1"],
      }),
    ).toBe(true);
    expect(
      canSubmitEnrollment({
        studentId: "student-2",
        pending: true,
        studentCount: 1,
        capacity: 30,
        enrolledIds: [],
      }),
    ).toBe(false);
  });

  it("hides students who are already on the class list", () => {
    expect(availableStudentChoices(students, ["student-1"]).map((choice) => choice.id)).toEqual(["student-2"]);
  });

  it("requires a student id", () => {
    expect(enrollStudentSchema.safeParse({ studentId: "" }).success).toBe(false);
    expect(enrollStudentSchema.safeParse({ studentId: "student-2" }).success).toBe(true);
  });
});
