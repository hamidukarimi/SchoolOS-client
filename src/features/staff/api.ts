import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeStaff, normalizeStaffList, normalizeStaffSummary } from "./normalize";
import { STAFF_PAGE_SIZE } from "./query";
import type { StaffListQuery, StaffListResult, StaffRecord, StaffSummary, StaffWritePayload } from "./types";

export const staffInvalidationKey = ["staff"] as const;

export function staffListKey(query: StaffListQuery) {
  return ["staff", "list", query] as const;
}

export function staffDetailKey(id: string) {
  return ["staff", "detail", id] as const;
}

export function staffSummaryKey() {
  return ["staff", "summary"] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchStaff(query: StaffListQuery): Promise<StaffListResult> {
  const params: Record<string, string | number> = {
    page: query.page,
    limit: STAFF_PAGE_SIZE,
  };
  if (query.search) params.search = query.search;
  if (query.department) params.department = query.department;
  if (query.status) params.status = query.status;
  if (query.contractType) params.contractType = query.contractType;
  const response = await http.get<ApiSuccess<unknown>>("/hr", { params });
  return normalizeStaffList(requireData(response.data.data, "Staff list"));
}

export async function fetchStaffMember(id: string): Promise<StaffRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/hr/${id}`);
  return normalizeStaff(requireData(response.data.data, "Staff"));
}

export async function fetchStaffSummary(): Promise<StaffSummary> {
  const response = await http.get<ApiSuccess<unknown>>("/hr/summary");
  return normalizeStaffSummary(requireData(response.data.data, "Staff summary"));
}

export async function createStaff(
  input: StaffWritePayload & { userId: string; staffId: string },
): Promise<{ staff: StaffRecord; message: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/hr", input);
  return {
    staff: normalizeStaff(requireData(response.data.data, "Create staff")),
    message: response.data.message ?? "Staff member created successfully",
  };
}

export async function updateStaff(
  id: string,
  input: StaffWritePayload,
): Promise<{ staff: StaffRecord; message: string }> {
  const response = await http.put<ApiSuccess<unknown>>(`/hr/${id}`, input);
  return {
    staff: normalizeStaff(requireData(response.data.data, "Staff update")),
    message: response.data.message ?? "Staff member updated successfully",
  };
}

export async function deleteStaff(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/hr/${id}`);
  return response.data.message ?? "Staff member deleted successfully";
}
