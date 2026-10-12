import {
  CLASS_STATUSES,
  type ClassListResult,
  type ClassRecord,
  type ClassStatus,
  type ClassStudentSummary,
  type ClassTeacherSummary,
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
  if (!value) throw new Error(`Class response did not include ${label}.`);
  return value;
}

function readStatus(value: string): ClassStatus {
  if ((CLASS_STATUSES as readonly string[]).includes(value)) return value as ClassStatus;
  throw new Error("Class response included an unsupported status.");
}

function readCapacity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error("Class response did not include a capacity.");
}

function readTeacher(value: unknown): ClassTeacherSummary | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstName = readText(value, "firstName").trim();
  const lastName = readText(value, "lastName").trim();
  if (!id || !firstName) return null;
  return {
    id,
    teacherId: readText(value, "teacherId"),
    firstName,
    lastName,
    subject: readText(value, "subject"),
  };
}

function readStudents(value: unknown): { students: ClassStudentSummary[]; studentCount: number } {
  if (!Array.isArray(value)) return { students: [], studentCount: 0 };
  const students: ClassStudentSummary[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const id = readId(item._id) ?? readId(item.id);
    const firstName = readText(item, "firstName").trim();
    const lastName = readText(item, "lastName").trim();
    if (!id || !firstName) continue;
    students.push({
      id,
      studentId: readText(item, "studentId"),
      firstName,
      lastName,
      status: readText(item, "status"),
    });
  }
  return { students, studentCount: value.length };
}

export function normalizeClassRecord(value: unknown): ClassRecord {
  if (!isRecord(value)) throw new Error("Class response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Class response did not include an id.");
  const roster = readStudents(value.students);

  return {
    id,
    name: readRequiredText(value, "name", "a name"),
    section: readRequiredText(value, "section", "a section"),
    grade: readRequiredText(value, "grade", "a grade"),
    teacher: readTeacher(value.teacherId),
    students: roster.students,
    studentCount: roster.studentCount,
    capacity: readCapacity(value.capacity),
    academicYear: readRequiredText(value, "academicYear", "an academic year"),
    status: readStatus(readText(value, "status")),
  };
}

export function normalizeClassList(value: unknown): ClassListResult {
  if (!isRecord(value) || !Array.isArray(value.classes)) {
    throw new Error("Class list response was not valid.");
  }
  const page = typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1;
  const total = typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0;
  const totalPages =
    typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0;

  return {
    classes: value.classes.map((item) => normalizeClassRecord(item)),
    total,
    page,
    totalPages,
  };
}
