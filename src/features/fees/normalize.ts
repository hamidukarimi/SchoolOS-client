import { FEE_STATUSES, type FeeListResult, type FeeRecord, type FeeStatus, type FeeStudentRef, type FeeSummary } from "./types";

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
  if (!value) throw new Error(`Fee response did not include ${label}.`);
  return value;
}

function readNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Fee response did not include ${label}.`);
}

function readStatus(value: string): FeeStatus {
  if ((FEE_STATUSES as readonly string[]).includes(value)) return value as FeeStatus;
  throw new Error("Fee response included an unsupported status.");
}

function readStudent(value: unknown): FeeStudentRef | null {
  if (!isRecord(value)) return null;
  const id = readId(value._id) ?? readId(value.id);
  const firstName = readText(value, "firstName").trim();
  if (!id || !firstName) return null;
  return {
    id,
    firstName,
    lastName: readText(value, "lastName").trim(),
    studentId: readText(value, "studentId"),
  };
}

export function normalizeFee(value: unknown): FeeRecord {
  if (!isRecord(value)) throw new Error("Fee response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Fee response did not include an id.");
  return {
    id,
    student: readStudent(value.studentId),
    title: readRequiredText(value, "title", "a title"),
    description: readText(value, "description"),
    amount: readNumber(value.amount, "an amount"),
    paidAmount: readNumber(value.paidAmount, "an amount paid"),
    dueDate: readText(value, "dueDate"),
    paidDate: readText(value, "paidDate"),
    status: readStatus(readText(value, "status")),
    academicYear: readRequiredText(value, "academicYear", "an academic year"),
    term: readRequiredText(value, "term", "a term"),
  };
}

export function normalizeFeeList(value: unknown): FeeListResult {
  if (!isRecord(value) || !Array.isArray(value.fees)) {
    throw new Error("Fee list response was not valid.");
  }
  const page = typeof value.page === "number" && Number.isFinite(value.page) ? value.page : 1;
  const total = typeof value.total === "number" && Number.isFinite(value.total) ? value.total : 0;
  const totalPages = typeof value.totalPages === "number" && Number.isFinite(value.totalPages) ? value.totalPages : 0;
  return {
    fees: value.fees.map((fee) => normalizeFee(fee)),
    total,
    page,
    totalPages,
  };
}

export function normalizeFeeSummary(value: unknown): FeeSummary {
  if (!isRecord(value)) throw new Error("Fee summary response was not valid.");
  const count = (key: string) => readNumber(value[key], key);
  return {
    totalAmount: count("totalAmount"),
    totalPaid: count("totalPaid"),
    totalPending: count("totalPending"),
    overdue: count("overdue"),
    paid: count("paid"),
    partial: count("partial"),
    pending: count("pending"),
    total: count("total"),
  };
}
