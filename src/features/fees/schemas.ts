import { z } from "zod";
import type { FeeCreatePayload, FeePaymentPayload, FeeWritePayload } from "./types";
import { FEE_STATUSES } from "./types";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Choose a student");

export const feeFormSchema = z.object({
  studentId: objectId,
  title: z.string().trim().min(1, "Title is required"),
  description: z.string(),
  amount: z.number().min(0, "Amount must be at least 0"),
  dueDate: z.string().min(1, "Due date is required"),
  academicYear: z.string().trim().min(1, "Academic year is required"),
  term: z.string().trim().min(1, "Term is required"),
  status: z.enum(FEE_STATUSES),
});

export const editFeeFormSchema = feeFormSchema.omit({ studentId: true });

export const paymentFormSchema = z.object({
  paidAmount: z.number().min(1, "Paid amount must be at least 1"),
  paidDate: z.string(),
});

export type FeeFormValues = z.infer<typeof feeFormSchema>;
export type EditFeeFormValues = z.infer<typeof editFeeFormSchema>;
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function toFeeCreatePayload(values: FeeFormValues): FeeCreatePayload {
  const payload: FeeCreatePayload = {
    studentId: values.studentId,
    title: values.title.trim(),
    amount: values.amount,
    dueDate: values.dueDate,
    academicYear: values.academicYear.trim(),
    term: values.term.trim(),
    status: values.status,
  };
  const description = values.description.trim();
  if (description) payload.description = description;
  return payload;
}

export function toFeeUpdatePayload(values: EditFeeFormValues): FeeWritePayload {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    amount: values.amount,
    dueDate: values.dueDate,
    academicYear: values.academicYear.trim(),
    term: values.term.trim(),
    status: values.status,
  };
}

export function toPaymentPayload(values: PaymentFormValues): FeePaymentPayload {
  const payload: FeePaymentPayload = { paidAmount: values.paidAmount };
  const paidDate = values.paidDate.trim();
  if (paidDate) payload.paidDate = paidDate;
  return payload;
}
