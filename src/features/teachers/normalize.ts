import {
  TEACHER_GENDERS,
  TEACHER_STATUSES,
  type TeacherAccountLink,
  type TeacherListResult,
  type TeacherRecord,
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

function readRequiredText(record: Record<string, unknown>, key: string, label: string): string {
  const value = readText(record, key).trim();
  if (!value) {
    throw new Error(`Teacher response did not include ${label}.`);
  }
  return value;
}

function readEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`Teacher response included an unsupported ${label}.`);
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readAccount(value: unknown): TeacherAccountLink | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id) ?? readId(value._id);
  const email = readText(value, "email").trim();
  if (!id || !email) return null;
  return { id, email };
}

export function normalizeTeacher(value: unknown): TeacherRecord {
  if (!isRecord(value)) {
    throw new Error("Teacher response was not an object.");
  }

  const id = readId(value._id) ?? readId(value.id);
  if (!id) {
    throw new Error("Teacher response did not include an id.");
  }

  return {
    id,
    teacherId: readRequiredText(value, "teacherId", "a teacher ID"),
    firstName: readRequiredText(value, "firstName", "a first name"),
    lastName: readRequiredText(value, "lastName", "a last name"),
    dateOfBirth: readText(value, "dateOfBirth"),
    gender: readEnum(readText(value, "gender"), TEACHER_GENDERS, "gender"),
    phone: readText(value, "phone"),
    address: readText(value, "address"),
    subject: readText(value, "subject"),
    qualification: readText(value, "qualification"),
    experience: readOptionalNumber(value.experience),
    salary: readOptionalNumber(value.salary),
    account: readAccount(value.userId),
    joinDate: readText(value, "joinDate"),
    status: readEnum(readText(value, "status"), TEACHER_STATUSES, "status"),
  };
}

export function normalizeTeacherList(value: unknown): TeacherListResult {
  if (!isRecord(value) || !Array.isArray(value.teachers)) {
    throw new Error("Teacher list response was not valid.");
  }

  const page = typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1;
  const total = typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0;
  const totalPages =
    typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0;

  return {
    teachers: value.teachers.map((teacher) => normalizeTeacher(teacher)),
    total,
    page,
    totalPages,
  };
}
