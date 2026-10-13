import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeAccount, normalizeAccountList } from "./normalize";
import { ACCOUNT_PAGE_SIZE } from "./query";
import type { AccountListQuery, AccountListResult, AccountRecord, AccountUpdatePayload, AccountWritePayload } from "./types";

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
  profile: "student" | "teacher" | "staff",
): { disabled: boolean; reason: string | null } {
  if (profile === "staff") return { disabled: false, reason: null };
  if (profile === "student" && account.hasStudentProfile) {
    return { disabled: true, reason: "Already has a student profile" };
  }
  if (profile === "teacher" && account.hasTeacherProfile) {
    return { disabled: true, reason: "Already has a teacher profile" };
  }
  return { disabled: false, reason: null };
}

export const accountInvalidationKey = ["accounts"] as const;

export function accountListKey(query: AccountListQuery) {
  return ["accounts", "list", query] as const;
}

export function accountDetailKey(id: string) {
  return ["accounts", "detail", id] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchAccounts(query: AccountListQuery): Promise<AccountListResult> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: ACCOUNT_PAGE_SIZE,
  };
  if (query.search) params.search = query.search;
  if (query.role) params.role = query.role;
  if (query.status) params.status = query.status;
  const response = await http.get<ApiSuccess<unknown>>("/admin/users", { params });
  return normalizeAccountList(requireData(response.data.data, "Account list"));
}

export async function fetchAccount(id: string): Promise<AccountRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/admin/users/${id}`);
  return normalizeAccount(requireData(response.data.data, "Account"));
}

export async function createAccount(input: AccountWritePayload): Promise<{ account: AccountRecord; message: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/admin/users", input);
  return {
    account: normalizeAccount(requireData(response.data.data, "Create account")),
    message: response.data.message ?? "Account created successfully",
  };
}

export async function updateAccount(
  id: string,
  input: AccountUpdatePayload,
): Promise<{ account: AccountRecord; message: string }> {
  const response = await http.patch<ApiSuccess<unknown>>(`/admin/users/${id}`, input);
  return {
    account: normalizeAccount(requireData(response.data.data, "Account update")),
    message: response.data.message ?? "Account updated successfully",
  };
}
