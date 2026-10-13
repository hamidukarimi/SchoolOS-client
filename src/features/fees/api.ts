import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { normalizeFee, normalizeFeeList, normalizeFeeSummary } from "./normalize";
import { FEE_PAGE_SIZE } from "./query";
import type {
  FeeCreatePayload,
  FeeListQuery,
  FeeListResult,
  FeePaymentPayload,
  FeeRecord,
  FeeSummary,
  FeeWritePayload,
} from "./types";

export function feeListKey(query: FeeListQuery) {
  return ["fees", query] as const;
}

export function feeDetailKey(id: string) {
  return ["fees", "detail", id] as const;
}

export function feeSummaryKey(studentId: string, academicYear?: string) {
  return ["fees", "summary", studentId, academicYear ?? ""] as const;
}

export const feeInvalidationKey = ["fees"] as const;

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchFees(query: FeeListQuery): Promise<FeeListResult> {
  const params: Record<string, string | number> = { page: query.page, limit: FEE_PAGE_SIZE };
  if (query.studentId) params.studentId = query.studentId;
  if (query.status) params.status = query.status;
  if (query.academicYear) params.academicYear = query.academicYear;
  if (query.term) params.term = query.term;
  const response = await http.get<ApiSuccess<unknown>>("/fees", { params });
  return normalizeFeeList(requireData(response.data.data, "Fee list"));
}

export async function fetchFee(id: string): Promise<FeeRecord> {
  const response = await http.get<ApiSuccess<unknown>>(`/fees/${id}`);
  return normalizeFee(requireData(response.data.data, "Fee"));
}

export async function fetchFeeSummary(studentId: string, academicYear?: string): Promise<FeeSummary> {
  const response = await http.get<ApiSuccess<unknown>>(`/fees/summary/${studentId}`, {
    params: academicYear ? { academicYear } : undefined,
  });
  return normalizeFeeSummary(requireData(response.data.data, "Fee summary"));
}

export async function createFee(input: FeeCreatePayload): Promise<{ fee: FeeRecord; message: string }> {
  const response = await http.post<ApiSuccess<unknown>>("/fees", input);
  return {
    fee: normalizeFee(requireData(response.data.data, "Create fee")),
    message: response.data.message ?? "Fee created successfully",
  };
}

export async function updateFee(id: string, input: FeeWritePayload): Promise<{ fee: FeeRecord; message: string }> {
  const response = await http.put<ApiSuccess<unknown>>(`/fees/${id}`, input);
  return {
    fee: normalizeFee(requireData(response.data.data, "Fee update")),
    message: response.data.message ?? "Fee updated successfully",
  };
}

export async function deleteFee(id: string): Promise<string> {
  const response = await http.delete<ApiSuccess<null>>(`/fees/${id}`);
  return response.data.message ?? "Fee deleted successfully";
}

export async function recordFeePayment(id: string, input: FeePaymentPayload): Promise<string> {
  const response = await http.post<ApiSuccess<unknown>>(`/fees/${id}/payment`, input);
  return response.data.message ?? "Payment recorded successfully";
}
