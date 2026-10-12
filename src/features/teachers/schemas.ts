import { z } from "zod";
import { TEACHER_GENDERS, TEACHER_STATUSES, type TeacherUpdatePayload } from "./types";

const optionalNonNegative = z.string().trim().refine((value) => {
  if (!value) return true;
  return /^\d+(\.\d+)?$/.test(value) && Number(value) >= 0;
}, "Enter a number that is 0 or greater");

export const teacherFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(TEACHER_GENDERS, { message: "Gender must be male or female" }),
  phone: z.string(),
  address: z.string(),
  subject: z.string(),
  qualification: z.string(),
  experience: optionalNonNegative,
  salary: optionalNonNegative,
  joinDate: z.string(),
  status: z.enum(TEACHER_STATUSES),
});

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

function optionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return Number(trimmed);
}

export function toTeacherUpdatePayload(values: TeacherFormValues): TeacherUpdatePayload {
  const payload: TeacherUpdatePayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    phone: values.phone.trim(),
    address: values.address.trim(),
    subject: values.subject.trim(),
    qualification: values.qualification.trim(),
    status: values.status,
  };

  const experience = optionalNumber(values.experience);
  const salary = optionalNumber(values.salary);
  const joinDate = values.joinDate.trim();
  if (experience !== undefined) payload.experience = experience;
  if (salary !== undefined) payload.salary = salary;
  if (joinDate) payload.joinDate = joinDate;

  return payload;
}
