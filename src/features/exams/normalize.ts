import {
  EXAM_STATUSES,
  type ExamClassRef,
  type ExamListResult,
  type ExamRecord,
  type ExamStatus,
  type ExamTeacherRef,
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

function readRequiredNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Exam response did not include ${label}.`);
}

function readStatus(value: string): ExamStatus {
  if ((EXAM_STATUSES as readonly string[]).includes(value)) return value as ExamStatus;
  throw new Error("Exam response included an unsupported status.");
}

function readClass(value: unknown): ExamClassRef | null {
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

function readTeacher(value: unknown): ExamTeacherRef | null {
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

export function normalizeExam(value: unknown): ExamRecord {
  if (!isRecord(value)) throw new Error("Exam response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  const title = readText(value, "title").trim();
  if (!id || !title) throw new Error("Exam response did not include an id.");
  return {
    id,
    title,
    description: readText(value, "description"),
    classRef: readClass(value.classId),
    subject: readText(value, "subject").trim(),
    teacher: readTeacher(value.teacherId),
    date: readText(value, "date"),
    startTime: readText(value, "startTime").trim(),
    endTime: readText(value, "endTime").trim(),
    totalMarks: readRequiredNumber(value.totalMarks, "total marks"),
    passingMarks: readRequiredNumber(value.passingMarks, "passing marks"),
    academicYear: readText(value, "academicYear").trim(),
    status: readStatus(readText(value, "status")),
  };
}

export function normalizeExamList(value: unknown): ExamListResult {
  if (!isRecord(value) || !Array.isArray(value.exams)) {
    throw new Error("Exam list response was not valid.");
  }
  return {
    exams: value.exams.map((item) => normalizeExam(item)),
    total: typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0,
    page: typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1,
    totalPages: typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0,
  };
}
