import {
  ATTENDANCE_STATUSES,
  type AttendanceClassRef,
  type AttendanceListResult,
  type AttendanceRecord,
  type AttendanceStatus,
  type AttendanceStudentRef,
  type AttendanceSummary,
  type AttendanceTeacherRef,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readStatus(value: string): AttendanceStatus {
  if ((ATTENDANCE_STATUSES as readonly string[]).includes(value)) return value as AttendanceStatus;
  throw new Error("Attendance response included an unsupported status.");
}

function readCount(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Attendance summary did not include ${label}.`);
}

function readStudent(value: unknown): AttendanceStudentRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstName = readText(value, "firstName").trim();
  if (!id || !firstName) return null;
  return {
    id,
    firstName,
    lastName: readText(value, "lastName").trim(),
    studentId: readText(value, "studentId"),
  };
}

function readClass(value: unknown): AttendanceClassRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const name = readText(value, "name").trim();
  if (!id || !name) return null;
  return {
    id,
    name,
    section: readText(value, "section").trim(),
    grade: readText(value, "grade").trim(),
  };
}

function readTeacher(value: unknown): AttendanceTeacherRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstName = readText(value, "firstName").trim();
  if (!id || !firstName) return null;
  return {
    id,
    firstName,
    lastName: readText(value, "lastName").trim(),
    teacherId: readText(value, "teacherId"),
  };
}

export function normalizeAttendance(value: unknown): AttendanceRecord {
  if (!isRecord(value)) throw new Error("Attendance response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Attendance response did not include an id.");
  return {
    id,
    student: readStudent(value.studentId),
    classRef: readClass(value.classId),
    teacher: readTeacher(value.teacherId),
    date: readText(value, "date"),
    status: readStatus(readText(value, "status")),
    note: readText(value, "note"),
  };
}

export function normalizeAttendanceList(value: unknown): AttendanceListResult {
  if (!isRecord(value) || !Array.isArray(value.attendance)) {
    throw new Error("Attendance list response was not valid.");
  }
  return {
    attendance: value.attendance.map((item) => normalizeAttendance(item)),
    total: typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0,
    page: typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1,
    totalPages: typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0,
  };
}

export function normalizeAttendanceSummary(value: unknown): AttendanceSummary {
  if (!isRecord(value)) throw new Error("Attendance summary response was not valid.");
  return {
    present: readCount(value.present, "present"),
    absent: readCount(value.absent, "absent"),
    late: readCount(value.late, "late"),
    excused: readCount(value.excused, "excused"),
    total: readCount(value.total, "total"),
    attendanceRate: readCount(value.attendanceRate, "attendance rate"),
  };
}
