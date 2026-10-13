import { z } from "zod";
import type { GradeCreatePayload, GradeUpdatePayload } from "./types";

export const recordGradeSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  examId: z.string().min(1, "Exam ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  subject: z.string().min(1, "Subject is required"),
  marksObtained: z.number().min(0, "Marks obtained must be at least 0"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  academicYear: z.string().min(1, "Academic year is required"),
  remarks: z.string(),
});

export const editGradeSchema = z.object({
  marksObtained: z.number().min(0, "Marks obtained must be at least 0"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  remarks: z.string(),
});

export type RecordGradeValues = z.infer<typeof recordGradeSchema>;
export type EditGradeValues = z.infer<typeof editGradeSchema>;

export function toGradeCreatePayload(values: RecordGradeValues): GradeCreatePayload {
  const payload: GradeCreatePayload = {
    studentId: values.studentId,
    examId: values.examId,
    classId: values.classId,
    teacherId: values.teacherId,
    subject: values.subject.trim(),
    marksObtained: values.marksObtained,
    totalMarks: values.totalMarks,
    academicYear: values.academicYear.trim(),
  };
  const remarks = values.remarks.trim();
  if (remarks) payload.remarks = remarks;
  return payload;
}

export function toGradeUpdatePayload(values: EditGradeValues): GradeUpdatePayload {
  return {
    marksObtained: values.marksObtained,
    totalMarks: values.totalMarks,
    remarks: values.remarks.trim(),
  };
}
