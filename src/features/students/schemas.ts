import { z } from "zod";
import { STUDENT_GENDERS, STUDENT_STATUSES, type StudentUpdatePayload } from "./types";

export const studentFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(STUDENT_GENDERS, { message: "Gender must be male or female" }),
  phone: z.string(),
  address: z.string(),
  parentName: z.string().trim().min(1, "Parent name is required"),
  parentPhone: z.string().trim().min(1, "Parent phone is required"),
  parentEmail: z.union([z.literal(""), z.string().trim().email("Invalid parent email")]),
  status: z.enum(STUDENT_STATUSES),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export const createStudentFormSchema = studentFormSchema.extend({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Choose an account"),
  studentId: z.string().trim().min(1, "Student ID is required"),
});

export type CreateStudentFormValues = z.infer<typeof createStudentFormSchema>;

export function toStudentCreatePayload(values: CreateStudentFormValues) {
  return {
    userId: values.userId,
    studentId: values.studentId.trim(),
    ...toStudentUpdatePayload(values),
  };
}

export function toStudentUpdatePayload(values: StudentFormValues): StudentUpdatePayload {
  const payload: StudentUpdatePayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    phone: values.phone.trim(),
    address: values.address.trim(),
    parentName: values.parentName.trim(),
    parentPhone: values.parentPhone.trim(),
    status: values.status,
  };

  const parentEmail = values.parentEmail.trim();
  if (parentEmail) payload.parentEmail = parentEmail;

  return payload;
}
