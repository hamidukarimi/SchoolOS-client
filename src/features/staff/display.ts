import type { SchoolPersona } from "../access/types";
import type { StaffContractType, StaffStatus } from "./types";

export function canManageStaff(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function staffStatusLabel(status: StaffStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    case "suspended":
      return "Suspended";
    case "terminated":
      return "Terminated";
  }
}

export function staffContractLabel(contractType: StaffContractType): string {
  switch (contractType) {
    case "full-time":
      return "Full-time";
    case "part-time":
      return "Part-time";
    case "contract":
      return "Contract";
  }
}

export function formatStaffAmount(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

export function formatStaffDate(value: string): string {
  const day = /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1];
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
