import {
  STAFF_CONTRACT_TYPES,
  STAFF_STATUSES,
  type StaffContractType,
  type StaffListQuery,
  type StaffStatus,
} from "./types";

export const STAFF_PAGE_SIZE = 20;

export function parseStaffListQuery(params: URLSearchParams): StaffListQuery {
  const search = (params.get("search") ?? "").trim();
  const department = (params.get("department") ?? "").trim();
  const rawStatus = params.get("status") ?? "";
  const status = (STAFF_STATUSES as readonly string[]).includes(rawStatus) ? (rawStatus as StaffStatus) : "";
  const rawContract = params.get("contractType") ?? "";
  const contractType = (STAFF_CONTRACT_TYPES as readonly string[]).includes(rawContract)
    ? (rawContract as StaffContractType)
    : "";
  const rawPage = Number(params.get("page"));
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  return { search, department, status, contractType, page };
}

export function staffListSearch(query: StaffListQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.department) params.set("department", query.department);
  if (query.status) params.set("status", query.status);
  if (query.contractType) params.set("contractType", query.contractType);
  if (query.page > 1) params.set("page", String(query.page));
  const value = params.toString();
  return value ? `?${value}` : "";
}
