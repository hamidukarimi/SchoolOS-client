import { describe, expect, it } from "vitest";
import { normalizeStudent, normalizeStudentList } from "./normalize";

const student = {
  _id: "student-1",
  studentId: "STU-100",
  firstName: "Amina",
  lastName: "Noori",
  dateOfBirth: "2012-04-03T00:00:00.000Z",
  gender: "female",
  phone: "0700000000",
  address: "Kabul",
  classId: { _id: "class-1", name: "Grade 6", section: "A" },
  userId: { id: "user-1", email: "amina@example.com" },
  parentName: "Laila Noori",
  parentPhone: "0700000001",
  parentEmail: "laila@example.com",
  enrollmentDate: "2024-03-01T00:00:00.000Z",
  status: "active",
};

describe("normalizeStudent", () => {
  it("reads the document id and populated class and account", () => {
    expect(normalizeStudent(student)).toMatchObject({
      id: "student-1",
      studentId: "STU-100",
      classSummary: { id: "class-1", name: "Grade 6", section: "A" },
      account: { id: "user-1", email: "amina@example.com" },
      status: "active",
    });
  });

  it("ignores an unpopulated user id and class id", () => {
    const record = normalizeStudent({
      ...student,
      id: "student-2",
      _id: undefined,
      userId: "user-1",
      classId: "class-1",
    });

    expect(record.id).toBe("student-2");
    expect(record.account).toBeNull();
    expect(record.classSummary).toBeNull();
  });

  it("rejects a response without an id or with an unknown status", () => {
    expect(() => normalizeStudent({ ...student, _id: "" })).toThrow(/id/);
    expect(() => normalizeStudent({ ...student, status: "parent" })).toThrow(/status/);
  });
});

describe("normalizeStudentList", () => {
  it("normalizes each student and the page fields", () => {
    expect(normalizeStudentList({ students: [student], total: 1, page: 2, totalPages: 3 })).toEqual({
      students: [normalizeStudent(student)],
      total: 1,
      page: 2,
      totalPages: 3,
    });
  });

  it("rejects a list that is not an object of students", () => {
    expect(() => normalizeStudentList({ students: null })).toThrow(/not valid/);
  });
});
