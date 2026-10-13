import {
  TIMETABLE_DAYS,
  TIMETABLE_STATUSES,
  type TimetableClassRef,
  type TimetableDay,
  type TimetableListResult,
  type TimetableRecord,
  type TimetableStatus,
  type TimetableTeacherRef,
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

function readDay(value: string): TimetableDay {
  if ((TIMETABLE_DAYS as readonly string[]).includes(value)) return value as TimetableDay;
  throw new Error("Timetable response included an unsupported day.");
}

function readStatus(value: string): TimetableStatus {
  if ((TIMETABLE_STATUSES as readonly string[]).includes(value)) return value as TimetableStatus;
  throw new Error("Timetable response included an unsupported status.");
}

function readClass(value: unknown): TimetableClassRef | null {
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

function readTeacher(value: unknown): TimetableTeacherRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstName = readText(value, "firstName").trim();
  if (!id || !firstName) return null;
  return {
    id,
    firstName,
    lastName: readText(value, "lastName").trim(),
    teacherId: readText(value, "teacherId"),
    subject: readText(value, "subject").trim(),
  };
}

export function normalizeTimetable(value: unknown): TimetableRecord {
  if (!isRecord(value)) throw new Error("Timetable response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Timetable response did not include an id.");
  return {
    id,
    classRef: readClass(value.classId),
    teacher: readTeacher(value.teacherId),
    subject: readText(value, "subject").trim(),
    dayOfWeek: readDay(readText(value, "dayOfWeek")),
    startTime: readText(value, "startTime").trim(),
    endTime: readText(value, "endTime").trim(),
    room: readText(value, "room").trim(),
    academicYear: readText(value, "academicYear").trim(),
    status: readStatus(readText(value, "status")),
  };
}

export function normalizeTimetableList(value: unknown): TimetableListResult {
  if (!isRecord(value) || !Array.isArray(value.timetables)) {
    throw new Error("Timetable list response was not valid.");
  }
  return {
    timetables: value.timetables.map((item) => normalizeTimetable(item)),
    total: typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0,
    page: typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1,
    totalPages: typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0,
  };
}
