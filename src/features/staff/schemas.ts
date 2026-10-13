import { z } from "zod";
import {
  STAFF_CONTRACT_TYPES,
  STAFF_GENDERS,
  STAFF_STATUSES,
  type StaffWritePayload,
} from "./types";

const requiredAmount = z
  .string()
  .trim()
  .refine((value) => /^\d+(\.\d+)?$/.test(value) && Number(value) >= 0, "Enter a number that is 0 or greater");

export const staffFormSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(STAFF_GENDERS, { message: "Gender must be male or female" }),
  phone: z.string(),
  address: z.string(),
  department: z.string().trim().min(1, "Department is required"),
  position: z.string().trim().min(1, "Position is required"),
  salary: requiredAmount,
  joinDate: z.string(),
  contractType: z.enum(STAFF_CONTRACT_TYPES),
  status: z.enum(STAFF_STATUSES),
});

export type StaffFormValues = z.infer<typeof staffFormSchema>;

export const createStaffFormSchema = staffFormSchema.extend({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "Choose an account"),
  staffId: z.string().trim().min(1, "Staff ID is required"),
});

export type CreateStaffFormValues = z.infer<typeof createStaffFormSchema>;

export function toStaffWritePayload(values: StaffFormValues): StaffWritePayload {
  const payload: StaffWritePayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    dateOfBirth: values.dateOfBirth,
    gender: values.gender,
    phone: values.phone.trim(),
    address: values.address.trim(),
    department: values.department.trim(),
    position: values.position.trim(),
    salary: Number(values.salary),
    contractType: values.contractType,
    status: values.status,
  };
  const joinDate = values.joinDate.trim();
  if (joinDate) payload.joinDate = joinDate;
  return payload;
}

export function toStaffCreatePayload(values: CreateStaffFormValues) {
  return {
    userId: values.userId,
    staffId: values.staffId.trim(),
    ...toStaffWritePayload(values),
  };
}
