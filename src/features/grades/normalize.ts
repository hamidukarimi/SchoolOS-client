import type {
  GradeClassRef,
  GradeExamRef,
  GradeListResult,
  GradeRecord,
  GradeStudentRef,
  GradeSummary,
  GradeTeacherRef,
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
  throw new Error(`Grade response did not include ${label}.`);
}

function readOptionalNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function readCount(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Grade summary did not include ${label}.`);
}

function readStudent(value: unknown): GradeStudentRef | null {
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

function readClass(value: unknown): GradeClassRef | null {
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

function readTeacher(value: unknown): GradeTeacherRef | null {
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

function readExam(value: unknown): GradeExamRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const title = readText(value, "title").trim();
  if (!id || !title) return null;
  return {
    id,
    title,
    date: readText(value, "date"),
    totalMarks: readOptionalNumber(value.totalMarks),
    passingMarks: readOptionalNumber(value.passingMarks),
  };
}

export function normalizeGrade(value: unknown): GradeRecord {
  if (!isRecord(value)) throw new Error("Grade response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Grade response did not include an id.");
  return {
    id,
    student: readStudent(value.studentId),
    exam: readExam(value.examId),
    classRef: readClass(value.classId),
    teacher: readTeacher(value.teacherId),
    subject: readText(value, "subject").trim(),
    marksObtained: readRequiredNumber(value.marksObtained, "marks obtained"),
    totalMarks: readRequiredNumber(value.totalMarks, "total marks"),
    grade: readText(value, "grade").trim(),
    remarks: readText(value, "remarks"),
    academicYear: readText(value, "academicYear").trim(),
  };
}

export function normalizeGradeList(value: unknown): GradeListResult {
  if (!isRecord(value) || !Array.isArray(value.grades)) {
    throw new Error("Grade list response was not valid.");
  }
  return {
    grades: value.grades.map((item) => normalizeGrade(item)),
    total: typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0,
    page: typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1,
    totalPages: typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0,
  };
}

export function normalizeGradeSummary(value: unknown): GradeSummary {
  if (!isRecord(value)) throw new Error("Grade summary response was not valid.");
  return {
    total: readCount(value.total, "total"),
    passed: readCount(value.passed, "passed"),
    failed: readCount(value.failed, "failed"),
    averageMarks: readCount(value.averageMarks, "average marks"),
  };
}
