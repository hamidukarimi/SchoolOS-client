import { ACCOUNT_GENDERS, ACCOUNT_ROLES, type AccountGender, type AccountListResult, type AccountRecord, type AccountRole, type AccountSummary } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function readRole(value: unknown): AccountRole {
  if ((ACCOUNT_ROLES as readonly string[]).includes(String(value))) return value as AccountRole;
  throw new Error("Account response did not include a valid role.");
}

function readGender(value: unknown): AccountGender | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if ((ACCOUNT_GENDERS as readonly string[]).includes(String(value))) return value as AccountGender;
  throw new Error("Account response did not include a valid gender.");
}

function readSummary(item: unknown): AccountSummary {
  if (!isRecord(item)) throw new Error("Account response was not valid.");
  const id = readText(item, "id");
  const email = readText(item, "email");
  if (!id || !email) throw new Error("Account response did not include an account.");
  if (typeof item.isActive !== "boolean") throw new Error("Account response did not include a status.");
  return {
    id,
    firstname: readText(item, "firstname"),
    lastname: readText(item, "lastname"),
    username: readText(item, "username"),
    email,
    role: readRole(item.role),
    isActive: item.isActive,
    hasStudentProfile: item.hasStudentProfile === true,
    hasTeacherProfile: item.hasTeacherProfile === true,
    hasStaffRecord: item.hasStaffRecord === true,
  };
}

export function normalizeAccountList(value: unknown): AccountListResult {
  if (!isRecord(value) || !Array.isArray(value.accounts)) {
    throw new Error("Account list response was not valid.");
  }
  return {
    accounts: value.accounts.map(readSummary),
    total: typeof value.total === "number" ? value.total : 0,
    page: typeof value.page === "number" ? value.page : 1,
    totalPages: typeof value.totalPages === "number" ? value.totalPages : 0,
  };
}

export function normalizeAccount(value: unknown): AccountRecord {
  const record = isRecord(value) && isRecord(value.account) ? value.account : value;
  const summary = readSummary(record);
  if (!isRecord(record)) throw new Error("Account response was not valid.");
  if (typeof record.isVerified !== "boolean") throw new Error("Account response did not include verification.");
  const createdAt = readText(record, "createdAt");
  const updatedAt = readText(record, "updatedAt");
  if (!createdAt || !updatedAt) throw new Error("Account response did not include dates.");
  const gender = readGender(record.gender);
  const birthday = readText(record, "birthday");
  const location = isRecord(record.location)
    ? {
        ...(readText(record.location, "city") ? { city: readText(record.location, "city") } : {}),
        ...(readText(record.location, "country") ? { country: readText(record.location, "country") } : {}),
      }
    : undefined;
  const studentProfileId = readText(record, "studentProfileId");
  const teacherProfileId = readText(record, "teacherProfileId");
  const staffRecordId = readText(record, "staffRecordId");
  return {
    ...summary,
    isVerified: record.isVerified,
    ...(gender ? { gender } : {}),
    ...(birthday ? { birthday } : {}),
    ...(location && (location.city || location.country) ? { location } : {}),
    createdAt,
    updatedAt,
    ...(studentProfileId ? { studentProfileId } : {}),
    ...(teacherProfileId ? { teacherProfileId } : {}),
    ...(staffRecordId ? { staffRecordId } : {}),
  };
}
