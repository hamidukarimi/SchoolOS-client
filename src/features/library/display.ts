import type { SchoolPersona } from "../access/types";
import type { BookStatus, BorrowStatus, BorrowerRef } from "./types";

export function canManageLibrary(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function bookListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review the catalog, add books, and record loans. Teachers and students can read the catalog and the loans the server allows.";
  }
  if (persona === "teacher") {
    return "This is the school catalog. Your loans, and loans for students on your class lists, are under Loans. Only an administrator can change books or record a loan.";
  }
  if (persona === "student") {
    return "This is the school catalog. Your loans are under Loans. Only an administrator can change books or record a loan.";
  }
  return "Library records are not available for this account.";
}

export function bookStatusLabel(status: BookStatus): string {
  return status === "available" ? "Available" : "Unavailable";
}

export function borrowStatusLabel(status: BorrowStatus): string {
  switch (status) {
    case "borrowed":
      return "Borrowed";
    case "returned":
      return "Returned";
    case "overdue":
      return "Overdue";
  }
}

export function borrowerLabel(borrower: BorrowerRef | null, borrowerType: string): string {
  if (!borrower) return `${borrowerType} details were not returned`;
  const name = `${borrower.firstName} ${borrower.lastName}`.trim();
  return borrower.code ? `${name} · ${borrower.code}` : name;
}

export function libraryDateInput(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? "";
}

export function formatLibraryDate(value: string): string {
  const day = libraryDateInput(value);
  if (!day) return "Not recorded";
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, date ?? 1));
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeZone: "UTC" }).format(utc);
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
