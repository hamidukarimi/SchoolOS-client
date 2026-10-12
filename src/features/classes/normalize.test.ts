import { describe, expect, it } from "vitest";
import { normalizeClassList, normalizeClassRecord } from "./normalize";

const classRecord = {
  _id: "class-1",
  name: "Grade 6",
  section: "A",
  grade: "6",
  teacherId: { _id: "teacher-1", firstName: "Karim", lastName: "Rahimi", teacherId: "TCH-100" },
  students: ["student-1", "student-2"],
  capacity: 30,
  academicYear: "2026",
  status: "active",
};

describe("normalizeClassRecord", () => {
  it("counts student ids and reads a populated teacher", () => {
    expect(normalizeClassRecord(classRecord)).toMatchObject({
      id: "class-1",
      name: "Grade 6",
      section: "A",
      studentCount: 2,
      students: [],
      teacher: { id: "teacher-1", firstName: "Karim", lastName: "Rahimi", teacherId: "TCH-100" },
      capacity: 30,
      status: "active",
    });
  });

  it("reads populated students and ignores an unpopulated teacher id", () => {
    const record = normalizeClassRecord({
      ...classRecord,
      teacherId: "teacher-1",
      students: [
        { _id: "student-1", firstName: "Amina", lastName: "Noori", studentId: "STU-100", status: "active" },
      ],
    });
    expect(record.teacher).toBeNull();
    expect(record.studentCount).toBe(1);
    expect(record.students[0]).toMatchObject({ id: "student-1", studentId: "STU-100", firstName: "Amina" });
  });

  it("rejects a missing id, capacity, or unknown status", () => {
    expect(() => normalizeClassRecord({ ...classRecord, _id: "" })).toThrow(/id/);
    expect(() => normalizeClassRecord({ ...classRecord, capacity: "30" })).toThrow(/capacity/);
    expect(() => normalizeClassRecord({ ...classRecord, status: "suspended" })).toThrow(/status/);
  });
});

describe("normalizeClassList", () => {
  it("reads the classes collection", () => {
    expect(normalizeClassList({ classes: [classRecord], total: 1, page: 1, totalPages: 1 }).classes).toHaveLength(1);
  });

  it("does not accept a student list shape", () => {
    expect(() => normalizeClassList({ students: [classRecord] })).toThrow(/not valid/);
  });
});
