import type { SchoolPersona } from "../access/types";
import type { AccountRole, AccountSummary } from "./types";

export function canManageAccounts(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function accountRoleLabel(role: AccountRole): string {
  return role === "admin" ? "Administrator" : "User";
}

export function accountStatusLabel(isActive: boolean): string {
  return isActive ? "Active" : "Deactivated";
}

export function linkedProfileSummary(account: Pick<AccountSummary, "hasStudentProfile" | "hasTeacherProfile" | "hasStaffRecord">): string {
  const parts: string[] = [];
  if (account.hasStudentProfile) parts.push("Student profile");
  if (account.hasTeacherProfile) parts.push("Teacher profile");
  if (account.hasStaffRecord) parts.push("Staff record");
  return parts.length > 0 ? parts.join(", ") : "No student, teacher, or staff record";
}

export function accountDirectoryCopy(kind: "loading" | "error" | "empty" | "filtered"): string {
  switch (kind) {
    case "loading":
      return "Loading accounts";
    case "error":
      return "Accounts could not be loaded.";
    case "empty":
      return "There are no accounts yet.";
    case "filtered":
      return "No accounts match these filters.";
  }
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
