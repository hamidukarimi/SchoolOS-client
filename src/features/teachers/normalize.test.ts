import { describe, expect, it } from "vitest";
import { normalizeTeacher, normalizeTeacherList } from "./normalize";

const teacher = {
  _id: "teacher-1",
  teacherId: "TCH-100",
  firstName: "Karim",
  lastName: "Rahimi",
  dateOfBirth: "1988-01-12T00:00:00.000Z",
  gender: "male",
  phone: "0700000000",
  address: "Kabul",
  subject: "Mathematics",
  qualification: "Bachelor",
  experience: 6,
  salary: 0,
  userId: { id: "user-1", email: "karim@example.com" },
  joinDate: "2020-09-01T00:00:00.000Z",
  status: "active",
};

describe("normalizeTeacher", () => {
  it("reads the document id, numbers, and populated account email", () => {
    expect(normalizeTeacher(teacher)).toMatchObject({
      id: "teacher-1",
      teacherId: "TCH-100",
      subject: "Mathematics",
      experience: 6,
      salary: 0,
      account: { id: "user-1", email: "karim@example.com" },
      status: "active",
    });
  });

  it("ignores an unpopulated user id and missing numbers", () => {
    const record = normalizeTeacher({
      ...teacher,
      id: "teacher-2",
      _id: undefined,
      userId: "user-1",
      experience: undefined,
      salary: undefined,
    });

    expect(record.id).toBe("teacher-2");
    expect(record.account).toBeNull();
    expect(record.experience).toBeNull();
    expect(record.salary).toBeNull();
  });

  it("rejects a missing id and a student-only status", () => {
    expect(() => normalizeTeacher({ ...teacher, _id: "" })).toThrow(/id/);
    expect(() => normalizeTeacher({ ...teacher, status: "graduated" })).toThrow(/status/);
  });
});

describe("normalizeTeacherList", () => {
  it("reads the teachers collection and page fields", () => {
    expect(normalizeTeacherList({ teachers: [teacher], total: 1, page: 2, totalPages: 3 })).toEqual({
      teachers: [normalizeTeacher(teacher)],
      total: 1,
      page: 2,
      totalPages: 3,
    });
  });

  it("does not accept a student list shape", () => {
    expect(() => normalizeTeacherList({ students: [teacher], total: 1, page: 1, totalPages: 1 })).toThrow(
      /not valid/,
    );
  });
});
