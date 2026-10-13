import { describe, expect, it } from "vitest";
import { examListKey } from "./api";
import { canManageExams, examDateInput } from "./display";
import { normalizeExam, normalizeExamList } from "./normalize";
import { examChoicesQuery, examListQueryForPersona, examListSearch, parseExamListQuery } from "./query";
import { examFormSchema, toExamCreatePayload, toExamUpdatePayload } from "./schemas";

const exam = {
  _id: "exam-1",
  title: "Midterm",
  description: "Closed book",
  classId: { _id: "class-1", name: "Grade 6", section: "A", grade: "6" },
  subject: "Mathematics",
  teacherId: { _id: "teacher-1", firstName: "Karim", lastName: "Rahimi", teacherId: "TCH-1", subject: "Mathematics" },
  date: "2026-10-13T00:00:00.000Z",
  startTime: "09:00",
  endTime: "10:30",
  totalMarks: 100,
  passingMarks: 40,
  academicYear: "2026-2027",
  status: "scheduled",
};

const form = {
  title: " Midterm ",
  description: "  ",
  classId: "class-1",
  subject: " Mathematics ",
  teacherId: "teacher-1",
  date: "2026-10-13",
  startTime: " 09:00 ",
  endTime: " 10:30 ",
  totalMarks: 100,
  passingMarks: 120,
  academicYear: " 2026-2027 ",
  status: "scheduled" as const,
};

describe("normalizeExam", () => {
  it("reads populated class and teacher names", () => {
    expect(normalizeExam(exam)).toMatchObject({
      id: "exam-1",
      title: "Midterm",
      classRef: { id: "class-1", name: "Grade 6", section: "A" },
      teacher: { id: "teacher-1", teacherId: "TCH-1" },
      totalMarks: 100,
      passingMarks: 40,
      status: "scheduled",
    });
  });

  it("ignores raw ids and rejects an unknown status", () => {
    expect(normalizeExam({ ...exam, classId: "class-1", teacherId: "teacher-1" })).toMatchObject({
      classRef: null,
      teacher: null,
    });
    expect(() => normalizeExam({ ...exam, status: "draft" })).toThrow(/status/);
  });

  it("rejects an exam without marks", () => {
    expect(() => normalizeExam({ ...exam, passingMarks: "40" })).toThrow(/passing marks/);
  });
});

describe("exam list", () => {
  it("reads the exams collection", () => {
    expect(normalizeExamList({ exams: [exam], total: 1, page: 1, totalPages: 1 }).exams).toHaveLength(1);
    expect(() => normalizeExamList({ grades: [] })).toThrow(/not valid/);
  });

  it("keeps subject, year, and status filters", () => {
    const query = parseExamListQuery(
      new URLSearchParams("subject=Mathematics&academicYear=2026-2027&status=completed&classId=class-1&page=2"),
    );
    expect(query).toMatchObject({
      subject: "Mathematics",
      academicYear: "2026-2027",
      status: "completed",
      classId: "class-1",
      page: 2,
    });
    expect(parseExamListQuery(new URLSearchParams("status=draft")).status).toBe("");
    expect(examListSearch(query)).toBe("?classId=class-1&subject=Mathematics&status=completed&academicYear=2026-2027&page=2");
  });

  it("does not send a class filter for a student, because the server replaces it", () => {
    const query = parseExamListQuery(new URLSearchParams("classId=other-class&subject=Mathematics"));
    expect(examListQueryForPersona(query, "student").classId).toBe("");
    expect(examListQueryForPersona(query, "teacher").classId).toBe("other-class");
  });

  it("keeps result choices on the exam query so a saved exam can refresh that list", () => {
    expect(examListKey(examChoicesQuery("Mathematics"))[0]).toBe("exams");
    expect(examChoicesQuery(" Mathematics ").subject).toBe("Mathematics");
  });

  it("keeps the calendar day from the stored timestamp", () => {
    expect(examDateInput("2026-10-13T00:00:00.000Z")).toBe("2026-10-13");
    expect(examDateInput("not-a-date")).toBe("");
  });
});

describe("exam permissions and payloads", () => {
  it("lets only an administrator change exams", () => {
    expect(canManageExams("admin")).toBe(true);
    expect(canManageExams("teacher")).toBe(false);
    expect(canManageExams("student")).toBe(false);
    expect(canManageExams("unscoped")).toBe(false);
  });

  it("omits a blank description and allows passing marks above the total", () => {
    expect(toExamCreatePayload(form)).toEqual({
      title: "Midterm",
      classId: "class-1",
      subject: "Mathematics",
      teacherId: "teacher-1",
      date: "2026-10-13",
      startTime: "09:00",
      endTime: "10:30",
      totalMarks: 100,
      passingMarks: 120,
      academicYear: "2026-2027",
      status: "scheduled",
    });
    expect(examFormSchema.shape.totalMarks.safeParse(0).success).toBe(false);
    expect(examFormSchema.shape.passingMarks.safeParse(120).success).toBe(true);
    expect(examFormSchema.shape.date.safeParse("13/10/2026").success).toBe(false);
  });

  it("sends a cleared description on update", () => {
    expect(toExamUpdatePayload(form).description).toBe("");
  });
});
