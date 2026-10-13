import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";

export interface AccountChoice {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  hasStudentProfile: boolean;
  hasTeacherProfile: boolean;
}

export interface AccountSearchResult {
  users: AccountChoice[];
  total: number;
  page: number;
  totalPages: number;
}

export function accountSearchKey(search: string) {
  return ["users", "directory", search] as const;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readText(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeAccountSearch(value: unknown): AccountSearchResult {
  if (!isRecord(value) || !Array.isArray(value.users)) {
    throw new Error("Account search response was not valid.");
  }
  return {
    users: value.users.map((item) => {
      if (!isRecord(item)) throw new Error("Account search response was not valid.");
      const id = readText(item, "id");
      const email = readText(item, "email");
      if (!id || !email) throw new Error("Account search response did not include an account.");
      return {
        id,
        firstname: readText(item, "firstname"),
        lastname: readText(item, "lastname"),
        username: readText(item, "username"),
        email,
        hasStudentProfile: item.hasStudentProfile === true,
        hasTeacherProfile: item.hasTeacherProfile === true,
      };
    }),
    total: typeof value.total === "number" ? value.total : 0,
    page: typeof value.page === "number" ? value.page : 1,
    totalPages: typeof value.totalPages === "number" ? value.totalPages : 0,
  };
}

export async function searchAccounts(search: string): Promise<AccountSearchResult> {
  const response = await http.get<ApiSuccess<unknown>>("/users", { params: { search, limit: 20 } });
  if (response.data.data === undefined || response.data.data === null) {
    throw new Error("Account search response did not include data.");
  }
  return normalizeAccountSearch(response.data.data);
}

export function accountLinkState(
  account: AccountChoice,
  profile: "student" | "teacher",
): { disabled: boolean; reason: string | null } {
  if (profile === "student" && account.hasStudentProfile) {
    return { disabled: true, reason: "Already has a student profile" };
  }
  if (profile === "teacher" && account.hasTeacherProfile) {
    return { disabled: true, reason: "Already has a teacher profile" };
  }
  return { disabled: false, reason: null };
}
