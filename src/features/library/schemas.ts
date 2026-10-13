import { z } from "zod";
import type { BookWritePayload, BorrowPayload, ReturnPayload } from "./types";
import { BOOK_STATUSES, BORROWER_TYPES } from "./types";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Choose a borrower");

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  author: z.string().trim().min(1, "Author is required"),
  isbn: z.string(),
  category: z.string().trim().min(1, "Category is required"),
  totalCopies: z.number().min(1, "Total copies must be at least 1"),
  availableCopies: z.number().min(0, "Available copies must be at least 0"),
  description: z.string(),
  publishedYear: z.string().refine((value) => value.trim() === "" || /^\d{4}$/.test(value.trim()), "Enter a four-digit year"),
  status: z.enum(BOOK_STATUSES),
});

export const borrowFormSchema = z.object({
  borrowerId: objectId,
  borrowerType: z.enum(BORROWER_TYPES),
  dueDate: z.string().min(1, "Due date is required"),
});

export const returnFormSchema = z.object({
  returnDate: z.string(),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;
export type BorrowFormValues = z.infer<typeof borrowFormSchema>;
export type ReturnFormValues = z.infer<typeof returnFormSchema>;

function yearValue(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const year = Number(trimmed);
  return Number.isInteger(year) ? year : undefined;
}

export function toBookPayload(values: BookFormValues): BookWritePayload {
  const payload: BookWritePayload = {
    title: values.title.trim(),
    author: values.author.trim(),
    category: values.category.trim(),
    totalCopies: values.totalCopies,
    availableCopies: values.availableCopies,
    status: values.status,
  };
  const isbn = values.isbn.trim();
  const description = values.description.trim();
  const publishedYear = yearValue(values.publishedYear);
  if (isbn) payload.isbn = isbn;
  if (description) payload.description = description;
  if (publishedYear !== undefined) payload.publishedYear = publishedYear;
  return payload;
}

export function toBorrowPayload(values: BorrowFormValues): BorrowPayload {
  return {
    borrowerId: values.borrowerId,
    borrowerType: values.borrowerType,
    dueDate: values.dueDate,
  };
}

export function toReturnPayload(values: ReturnFormValues): ReturnPayload {
  const returnDate = values.returnDate.trim();
  return returnDate ? { returnDate } : {};
}
