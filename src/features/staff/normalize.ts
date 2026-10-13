import {
  STAFF_CONTRACT_TYPES,
  STAFF_GENDERS,
  STAFF_STATUSES,
  type StaffAccountLink,
  type StaffListResult,
  type StaffRecord,
  type StaffSummary,
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
  if (!value) throw new Error(`Staff response did not include ${label}.`);
  return value;
}

function readEnum<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Staff response included an unsupported ${label}.`);
}

function readNumber(value: unknown, label: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  throw new Error(`Staff response did not include ${label}.`);
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readAccount(value: unknown): StaffAccountLink | null {
  if (!isRecord(value)) return null;
  const id = readId(value.id) ?? readId(value._id);
  const email = readText(value, "email").trim();
  if (!id || !email) return null;
  return { id, email };
}

export function normalizeStaff(value: unknown): StaffRecord {
  if (!isRecord(value)) throw new Error("Staff response was not an object.");
  const id = readId(value._id) ?? readId(value.id);
  if (!id) throw new Error("Staff response did not include an id.");
  return {
    id,
    staffId: readRequiredText(value, "staffId", "a staff ID"),
    firstName: readRequiredText(value, "firstName", "a first name"),
    lastName: readRequiredText(value, "lastName", "a last name"),
    dateOfBirth: readText(value, "dateOfBirth"),
    gender: readEnum(readText(value, "gender"), STAFF_GENDERS, "gender"),
    phone: readText(value, "phone"),
    address: readText(value, "address"),
    department: readRequiredText(value, "department", "a department"),
    position: readRequiredText(value, "position", "a position"),
    salary: readNumber(value.salary, "a salary"),
    joinDate: readText(value, "joinDate"),
    contractType: readEnum(readText(value, "contractType"), STAFF_CONTRACT_TYPES, "contract type"),
    status: readEnum(readText(value, "status"), STAFF_STATUSES, "status"),
    account: readAccount(value.userId),
  };
}

export function normalizeStaffList(value: unknown): StaffListResult {
  if (!isRecord(value) || !Array.isArray(value.staff)) {
    throw new Error("Staff list response was not valid.");
  }
  return {
    staff: value.staff.map((item) => normalizeStaff(item)),
    total: readCount(value.total),
    page: typeof value.page === "number" && value.page > 0 ? value.page : 1,
    totalPages: readCount(value.totalPages),
  };
}

export function normalizeStaffSummary(value: unknown): StaffSummary {
  if (!isRecord(value) || !isRecord(value.byStatus) || !isRecord(value.byContractType)) {
    throw new Error("Staff summary response was not valid.");
  }
  return {
    total: readCount(value.total),
    byStatus: {
      active: readCount(value.byStatus.active),
      inactive: readCount(value.byStatus.inactive),
      suspended: readCount(value.byStatus.suspended),
      terminated: readCount(value.byStatus.terminated),
    },
    byContractType: {
      fullTime: readCount(value.byContractType.fullTime),
      partTime: readCount(value.byContractType.partTime),
      contract: readCount(value.byContractType.contract),
    },
    totalMonthlySalary: readNumber(value.totalMonthlySalary, "a salary total"),
  };
}
