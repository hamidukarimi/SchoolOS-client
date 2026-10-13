import {
  STUDENT_GENDERS,
  STUDENT_STATUSES,
  type StudentAccountLink,
  type EnrolledClass,
  type EnrolledClassTeacher,
  type StudentClassSummary,
  type StudentListResult,
  type StudentRecord,
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
    throw new Error(`Student response did not include ${label}.`);
  }
  return value;
}

function readEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if ((allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  throw new Error(`Student response included an unsupported ${label}.`);
}

function readAccount(value: unknown): StudentAccountLink | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id) ?? readId(value._id);
  const email = readText(value, "email").trim();
  if (!id || !email) return null;
  return { id, email };
}

function readClass(value: unknown): StudentClassSummary | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id) ?? readId(value._id);
  const name = readText(value, "name").trim();
  const section = readText(value, "section").trim();
  if (!id || !name) return null;
  return { id, name, section };
}

function readEnrolledTeacher(value: unknown): EnrolledClassTeacher | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id) ?? readId(value._id);
  if (!id) return null;
  return {
    id,
    firstName: readText(value, "firstName").trim(),
    lastName: readText(value, "lastName").trim(),
    teacherId: readText(value, "teacherId").trim(),
  };
}

export function normalizeEnrolledClasses(value: unknown): EnrolledClass[] {
  if (!isRecord(value) || !Array.isArray(value.classes)) {
    throw new Error("Enrolled classes response was not valid.");
  }

  return value.classes.map((item) => {
    if (!isRecord(item)) {
      throw new Error("Enrolled classes response was not valid.");
    }
    const id = readId(item.id) ?? readId(item._id);
    const name = readText(item, "name").trim();
    const grade = readText(item, "grade").trim();
    const academicYear = readText(item, "academicYear").trim();
    if (!id || !name || !grade || !academicYear) {
      throw new Error("Enrolled classes response was not valid.");
    }
    return {
      id,
      name,
      section: readText(item, "section").trim(),
      grade,
      academicYear,
      teacher: readEnrolledTeacher(item.teacher),
    };
  });
}

export function normalizeStudent(value: unknown): StudentRecord {
  if (!isRecord(value)) {
    throw new Error("Student response was not an object.");
  }

  const id = readId(value._id) ?? readId(value.id);
  if (!id) {
    throw new Error("Student response did not include an id.");
  }

  const gender = readEnum(readText(value, "gender"), STUDENT_GENDERS, "gender");
  const status = readEnum(readText(value, "status"), STUDENT_STATUSES, "status");

  return {
    id,
    studentId: readRequiredText(value, "studentId", "a student ID"),
    firstName: readRequiredText(value, "firstName", "a first name"),
    lastName: readRequiredText(value, "lastName", "a last name"),
    dateOfBirth: readText(value, "dateOfBirth"),
    gender,
    phone: readText(value, "phone"),
    address: readText(value, "address"),
    classSummary: readClass(value.classId),
    account: readAccount(value.userId),
    parentName: readText(value, "parentName"),
    parentPhone: readText(value, "parentPhone"),
    parentEmail: readText(value, "parentEmail"),
    enrollmentDate: readText(value, "enrollmentDate"),
    status,
  };
}

export function normalizeStudentList(value: unknown): StudentListResult {
  if (!isRecord(value) || !Array.isArray(value.students)) {
    throw new Error("Student list response was not valid.");
  }

  const page = typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1;
  const total = typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0;
  const totalPages =
    typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0;

  return {
    students: value.students.map((student) => normalizeStudent(student)),
    total,
    page,
    totalPages,
  };
}
