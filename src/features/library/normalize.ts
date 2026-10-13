import {
  BOOK_STATUSES,
  BORROW_STATUSES,
  BORROWER_TYPES,
  type BookListResult,
  type BookRecord,
  type BookStatus,
  type BorrowListResult,
  type BorrowRecord,
  type BorrowStatus,
  type BorrowerRef,
  type BorrowerType,
  type BorrowBookRef,
} from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  return null;
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

function readRequiredText(record: Record<string, unknown>, key: string, label: string): string {
  const value = readText(record, key).trim();
  if (!value) throw new Error(`Library response did not include ${label}.`);
  return value;
}

function readNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Library response did not include ${label}.`);
}

function readEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Library response included an unsupported ${label}.`);
}

function readBookRef(value: unknown): BorrowBookRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const title = readText(value, "title").trim();
  if (!id || !title) return null;
  return {
    id,
    title,
    author: readText(value, "author").trim(),
    isbn: readText(value, "isbn").trim(),
  };
}

function readBorrower(value: unknown): BorrowerRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstName = readText(value, "firstName").trim();
  if (!id || !firstName) return null;
  return {
    id,
    firstName,
    lastName: readText(value, "lastName").trim(),
    code: readText(value, "studentId").trim() || readText(value, "teacherId").trim(),
  };
}

export function normalizeBook(value: unknown): BookRecord {
  if (!isRecord(value)) throw new Error("Book response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Book response did not include an id.");
  const publishedYear = value.publishedYear;
  return {
    id,
    title: readRequiredText(value, "title", "a title"),
    author: readRequiredText(value, "author", "an author"),
    isbn: readText(value, "isbn"),
    category: readRequiredText(value, "category", "a category"),
    totalCopies: readNumber(value.totalCopies, "total copies"),
    availableCopies: readNumber(value.availableCopies, "available copies"),
    description: readText(value, "description"),
    publishedYear: typeof publishedYear === "number" && Number.isFinite(publishedYear) ? publishedYear : null,
    status: readEnum(readText(value, "status"), BOOK_STATUSES, "status") as BookStatus,
  };
}

export function normalizeBookList(value: unknown): BookListResult {
  if (!isRecord(value) || !Array.isArray(value.books)) {
    throw new Error("Book list response was not valid.");
  }
  return {
    books: value.books.map((book) => normalizeBook(book)),
    total: typeof value.total === "number" ? value.total : 0,
    page: typeof value.page === "number" ? value.page : 1,
    totalPages: typeof value.totalPages === "number" ? value.totalPages : 0,
  };
}

export function normalizeBorrow(value: unknown): BorrowRecord {
  if (!isRecord(value)) throw new Error("Borrow response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Borrow response did not include an id.");
  return {
    id,
    book: readBookRef(value.bookId),
    borrower: readBorrower(value.borrowerId),
    borrowerType: readEnum(readText(value, "borrowerType"), BORROWER_TYPES, "borrower type") as BorrowerType,
    borrowDate: readText(value, "borrowDate"),
    dueDate: readText(value, "dueDate"),
    returnDate: readText(value, "returnDate"),
    status: readEnum(readText(value, "status"), BORROW_STATUSES, "status") as BorrowStatus,
  };
}

export function normalizeBorrowList(value: unknown): BorrowListResult {
  if (!isRecord(value) || !Array.isArray(value.borrows)) {
    throw new Error("Borrow list response was not valid.");
  }
  return {
    borrows: value.borrows.map((borrow) => normalizeBorrow(borrow)),
    total: typeof value.total === "number" ? value.total : 0,
    page: typeof value.page === "number" ? value.page : 1,
    totalPages: typeof value.totalPages === "number" ? value.totalPages : 0,
  };
}
