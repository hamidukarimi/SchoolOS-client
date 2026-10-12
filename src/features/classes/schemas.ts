import { z } from "zod";
import { CLASS_STATUSES, type ClassWritePayload } from "./types";

const capacityField = z.string().trim().refine((value) => {
  return /^\d+(\.\d+)?$/.test(value) && Number(value) >= 1;
}, "Capacity must be at least 1");

export const classFormSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  section: z.string().trim().min(1, "Section is required"),
  grade: z.string().trim().min(1, "Grade is required"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  capacity: capacityField,
  teacherId: z.string(),
  status: z.enum(CLASS_STATUSES),
});

export type ClassFormValues = z.infer<typeof classFormSchema>;

export function toClassWritePayload(values: ClassFormValues): ClassWritePayload {
  const payload: ClassWritePayload = {
    name: values.name.trim(),
    section: values.section.trim(),
    grade: values.grade.trim(),
    academicYear: values.academicYear.trim(),
    capacity: Number(values.capacity.trim()),
    status: values.status,
  };
  const teacherId = values.teacherId.trim();
  if (teacherId) payload.teacherId = teacherId;
  return payload;
}
