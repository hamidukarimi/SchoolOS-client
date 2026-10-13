import { describe, expect, it } from "vitest";
import { normalizeAttendance, normalizeAttendanceList, normalizeAttendanceSummary } from "./normalize";
import { attendanceListSearch, parseAttendanceListQuery } from "./query";
import { recordAttendanceSchema, toAttendanceCreatePayload, toAttendanceUpdatePayload } from "./schemas";
import { canManageAttendance, canSubmitAttendance, attendanceDateInput } from "./display";

const record = {
  _id: "attendance-1",
  studentId: { _id: "student-1", firstName: "Amina", lastName: "Noori", studentId: "STU-1" },
  classId: { _id: "class-1", name: "Grade 6", section: "A", grade: "6" },
  teacherId: { _id: "teacher-1", firstName: "Karim", lastName: "Rahimi", teacherId: "TCH-1" },
  date: "2026-10-13T00:00:00.000Z",
  status: "late",
  note: "Arrived after the bell",
};

describe("normalizeAttendance", () => {
  it("reads populated student, class, and teacher names", () => {
    expect(normalizeAttendance(record)).toMatchObject({
      id: "attendance-1",
      student: { id: "student-1", studentId: "STU-1" },
      classRef: { id: "class-1", name: "Grade 6", section: "A" },
      teacher: { id: "teacher-1", teacherId: "TCH-1" },
      status: "late",
    });
  });

  it("ignores raw ids and rejects an unknown status", () => {
    expect(normalizeAttendance({ ...record, studentId: "student-1", classId: "class-1", teacherId: "teacher-1" })).toMatchObject({
      student: null,
      classRef: null,
      teacher: null,
    });
    expect(() => normalizeAttendance({ ...record, status: "holiday" })).toThrow(/status/);
  });
});

describe("attendance list and summary", () => {
  it("reads the attendance collection", () => {
    expect(normalizeAttendanceList({ attendance: [record], total: 1, page: 1, totalPages: 1 }).attendance).toHaveLength(1);
    expect(() => normalizeAttendanceList({ students: [] })).toThrow(/not valid/);
  });

  it("keeps a calendar date and drops an invalid status", () => {
    const query = parseAttendanceListQuery(new URLSearchParams("date=2026-10-13&status=present&classId=class-1&page=2"));
    expect(query).toMatchObject({ date: "2026-10-13", status: "present", classId: "class-1", page: 2 });
    expect(parseAttendanceListQuery(new URLSearchParams("date=yesterday&status=holiday")).date).toBe("");
    expect(attendanceListSearch(query)).toBe("?classId=class-1&status=present&date=2026-10-13&page=2");
  });

  it("reads the summary counts returned by the server", () => {
    expect(normalizeAttendanceSummary({ present: 8, absent: 1, late: 1, excused: 0, total: 10, attendanceRate: 90 })).toEqual({
      present: 8,
      absent: 1,
      late: 1,
      excused: 0,
      total: 10,
      attendanceRate: 90,
    });
  });

  it("keeps the calendar day from the stored timestamp", () => {
    expect(attendanceDateInput("2026-10-13T00:00:00.000Z")).toBe("2026-10-13");
    expect(attendanceDateInput("not-a-date")).toBe("");
  });
});

describe("attendance permissions and payloads", () => {
  it("lets only an administrator change attendance", () => {
    expect(canManageAttendance("admin")).toBe(true);
    expect(canManageAttendance("teacher")).toBe(false);
    expect(canManageAttendance("student")).toBe(false);
    expect(canManageAttendance("unscoped")).toBe(false);
  });

  it("omits a blank note and blocks a student already marked that day", () => {
    expect(
      toAttendanceCreatePayload({
        studentId: "student-1",
        classId: "class-1",
        teacherId: "teacher-1",
        date: "2026-10-13",
        status: "present",
        note: "  ",
      }),
    ).toEqual({
      studentId: "student-1",
      classId: "class-1",
      teacherId: "teacher-1",
      date: "2026-10-13",
      status: "present",
    });
    expect(recordAttendanceSchema.shape.date.safeParse("13/10/2026").success).toBe(false);
    expect(
      canSubmitAttendance({
        pending: false,
        studentId: "student-1",
        classId: "class-1",
        teacherId: "teacher-1",
        date: "2026-10-13",
        markedStudentIds: ["student-1"],
      }),
    ).toBe(false);
    expect(
      canSubmitAttendance({
        pending: true,
        studentId: "student-2",
        classId: "class-1",
        teacherId: "teacher-1",
        date: "2026-10-13",
        markedStudentIds: [],
      }),
    ).toBe(false);
  });

  it("sends status and note on update, including a cleared note", () => {
    expect(toAttendanceUpdatePayload({ status: "excused", note: "  " })).toEqual({
      status: "excused",
      note: "",
    });
  });
});
