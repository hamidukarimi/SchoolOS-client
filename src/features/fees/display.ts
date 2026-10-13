import type { SchoolPersona } from "../access/types";
import type { FeeRecord, FeeStatus, FeeStudentRef } from "./types";

export function canManageFees(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function feeListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review fee records, create a charge for an existing student, and record payments. Teachers and students can read the records the server allows.";
  }
  if (persona === "teacher") {
    return "These fee records are for students on your class lists. Only an administrator can change them or record a payment.";
  }
  if (persona === "student") {
    return "These are your fee records. You cannot change them or record a payment.";
  }
  return "Fee records are not available for this account.";
}

export function feeStatusLabel(status: FeeStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "partial":
      return "Partially paid";
    case "paid":
      return "Paid";
    case "overdue":
      return "Overdue";
  }
}

export function feeStudentLabel(student: FeeStudentRef | null): string {
  if (!student) return "Student details were not returned";
  const name = `${student.firstName} ${student.lastName}`.trim();
  return student.studentId ? `${name} · ${student.studentId}` : name;
}

export function formatFeeAmount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function feeOutstanding(record: Pick<FeeRecord, "amount" | "paidAmount">): number {
  const remaining = record.amount - record.paidAmount;
  if (!Number.isFinite(remaining)) return 0;
  return remaining > 0 ? remaining : 0;
}

export function feeDateInput(value: string): string {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? "";
}

export function formatFeeDate(value: string): string {
  const day = feeDateInput(value);
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
