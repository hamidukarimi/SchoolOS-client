import { z } from "zod";
import { EXAM_STATUSES, type ExamWritePayload } from "./types";

export const examFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  classId: z.string().min(1, "Class ID is required"),
  subject: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  passingMarks: z.number().min(1, "Passing marks must be at least 1"),
  academicYear: z.string().min(1, "Academic year is required"),
  status: z.enum(EXAM_STATUSES, { message: "Status must be scheduled, ongoing, completed or cancelled" }),
});

export type ExamFormValues = z.infer<typeof examFormSchema>;

export function toExamCreatePayload(values: ExamFormValues): ExamWritePayload {
  const payload: ExamWritePayload = {
    title: values.title.trim(),
    classId: values.classId,
    subject: values.subject.trim(),
    teacherId: values.teacherId,
    date: values.date,
    startTime: values.startTime.trim(),
    endTime: values.endTime.trim(),
    totalMarks: values.totalMarks,
    passingMarks: values.passingMarks,
    academicYear: values.academicYear.trim(),
    status: values.status,
  };
  const description = values.description.trim();
  if (description) payload.description = description;
  return payload;
}

export function toExamUpdatePayload(values: ExamFormValues): ExamWritePayload {
  return {
    ...toExamCreatePayload(values),
    description: values.description.trim(),
  };
}
