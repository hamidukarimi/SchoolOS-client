import { describe, expect, it } from "vitest";
import { canManageGrades, canSubmitGrade, marksPercentage } from "./display";
import { normalizeGrade, normalizeGradeList, normalizeGradeSummary } from "./normalize";
import { gradeListQueryForPersona, gradeListSearch, parseGradeListQuery } from "./query";
import { recordGradeSchema, toGradeCreatePayload, toGradeUpdatePayload } from "./schemas";

const record = {
  _id: "grade-1",
  studentId: { _id: "student-1", firstName: "Amina", lastName: "Noori", studentId: "STU-1" },
  examId: { _id: "exam-1", title: "Midterm", date: "2026-10-13T00:00:00.000Z", totalMarks: 100, passingMarks: 40 },
  classId: { _id: "class-1", name: "Grade 6", section: "A", grade: "6" },
  teacherId: { _id: "teacher-1", firstName: "Karim", lastName: "Rahimi", teacherId: "TCH-1" },
  subject: "Mathematics",
  marksObtained: 82,
  totalMarks: 100,
  grade: "A",
  remarks: "Steady work",
  academicYear: "2026-2027",
};

const ready = {
  pending: false,
  studentId: "student-1",
  examId: "exam-1",
  classId: "class-1",
  teacherId: "teacher-1",
  subject: "Mathematics",
  academicYear: "2026-2027",
  marksObtained: 110,
  totalMarks: 100,
  gradedStudentIds: [] as string[],
};

describe("normalizeGrade", () => {
  it("reads populated student, exam, class, and teacher names", () => {
    expect(normalizeGrade(record)).toMatchObject({
      id: "grade-1",
      student: { id: "student-1", studentId: "STU-1" },
      exam: { id: "exam-1", title: "Midterm", totalMarks: 100, passingMarks: 40 },
      classRef: { id: "class-1", name: "Grade 6", section: "A" },
      teacher: { id: "teacher-1", teacherId: "TCH-1" },
      subject: "Mathematics",
      marksObtained: 82,
      grade: "A",
      academicYear: "2026-2027",
    });
  });

  it("ignores raw ids and keeps an unexpected stored letter", () => {
    expect(normalizeGrade({ ...record, studentId: "student-1", examId: "exam-1", classId: "class-1", teacherId: "teacher-1" })).toMatchObject({
      student: null,
      exam: null,
      classRef: null,
      teacher: null,
    });
    expect(normalizeGrade({ ...record, grade: "Merit" }).grade).toBe("Merit");
  });

  it("rejects a result without marks", () => {
    expect(() => normalizeGrade({ ...record, marksObtained: "82" })).toThrow(/marks obtained/);
  });
});

describe("grade list, exams, and summary", () => {
  it("reads the grades collection", () => {
    expect(normalizeGradeList({ grades: [record], total: 1, page: 1, totalPages: 1 }).grades).toHaveLength(1);
    expect(() => normalizeGradeList({ attendance: [] })).toThrow(/not valid/);
  });

  it("keeps subject, year, and exam filters", () => {
    const query = parseGradeListQuery(
      new URLSearchParams("subject=Mathematics&academicYear=2026-2027&examId=exam-1&classId=class-1&page=2"),
    );
    expect(query).toMatchObject({
      subject: "Mathematics",
      academicYear: "2026-2027",
      examId: "exam-1",
      classId: "class-1",
      page: 2,
    });
    expect(gradeListSearch(query)).toBe("?examId=exam-1&classId=class-1&subject=Mathematics&academicYear=2026-2027&page=2");
  });

  it("does not let a student filter by another student id", () => {
    const query = parseGradeListQuery(new URLSearchParams("studentId=other-student&subject=Mathematics"));
    expect(gradeListQueryForPersona(query, "student").studentId).toBe("");
    expect(gradeListQueryForPersona(query, "teacher").studentId).toBe("other-student");
    expect(gradeListQueryForPersona(query, "admin").studentId).toBe("other-student");
  });

  it("reads the summary counts returned by the server", () => {
    expect(normalizeGradeSummary({ total: 4, passed: 3, failed: 1, averageMarks: 72.5, grades: [] })).toEqual({
      total: 4,
      passed: 3,
      failed: 1,
      averageMarks: 72.5,
    });
  });
});

describe("grade permissions and payloads", () => {
  it("lets only an administrator change results", () => {
    expect(canManageGrades("admin")).toBe(true);
    expect(canManageGrades("teacher")).toBe(false);
    expect(canManageGrades("student")).toBe(false);
    expect(canManageGrades("unscoped")).toBe(false);
  });

  it("omits a blank remark and blocks a student who already has this exam", () => {
    expect(
      toGradeCreatePayload({
        studentId: "student-1",
        examId: "exam-1",
        classId: "class-1",
        teacherId: "teacher-1",
        subject: " Mathematics ",
        marksObtained: 82,
        totalMarks: 100,
        academicYear: " 2026-2027 ",
        remarks: "  ",
      }),
    ).toEqual({
      studentId: "student-1",
      examId: "exam-1",
      classId: "class-1",
      teacherId: "teacher-1",
      subject: "Mathematics",
      marksObtained: 82,
      totalMarks: 100,
      academicYear: "2026-2027",
    });
    expect(recordGradeSchema.shape.subject.safeParse("").success).toBe(false);
    expect(recordGradeSchema.shape.marksObtained.safeParse(-1).success).toBe(false);
    expect(recordGradeSchema.shape.totalMarks.safeParse(0).success).toBe(false);
    expect(canSubmitGrade({ ...ready, gradedStudentIds: ["student-1"] })).toBe(false);
    expect(canSubmitGrade({ ...ready, pending: true })).toBe(false);
  });

  it("allows marks above the total because the server accepts them", () => {
    expect(canSubmitGrade(ready)).toBe(true);
    expect(marksPercentage(110, 100)).toBe(110);
    expect(marksPercentage(82, 0)).toBeNull();
  });

  it("sends marks and remarks on update, including a cleared remark", () => {
    expect(toGradeUpdatePayload({ marksObtained: 70, totalMarks: 100, remarks: "  " })).toEqual({
      marksObtained: 70,
      totalMarks: 100,
      remarks: "",
    });
  });
});
