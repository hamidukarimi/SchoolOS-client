import { ACCOUNT_ROLES, ACCOUNT_STATUSES, type AccountListQuery, type AccountRole, type AccountStatus } from "./types";

export const ACCOUNT_PAGE_SIZE = 20;

export function parseAccountListQuery(params: URLSearchParams): AccountListQuery {
  const search = (params.get("search") ?? "").trim();
  const rawRole = params.get("role") ?? "";
  const role = (ACCOUNT_ROLES as readonly string[]).includes(rawRole) ? (rawRole as AccountRole) : "";
  const rawStatus = params.get("status") ?? "";
  const status = (ACCOUNT_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as AccountStatus) : "";
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  return { search, role, status, page };
}

export function accountListSearch(query: AccountListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.role) params.set("role", query.role);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
