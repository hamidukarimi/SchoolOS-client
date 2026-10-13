import axios from "axios";
import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import type { ReportDefinition } from "./display";
import { normalizeReport } from "./normalize";
import type { ReportResult } from "./types";

export function reportKey(id: string, params: Record<string, string | number>) {
  return ["reports", id, params] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) throw new Error(`${action} response did not include data.`);
  return data;
}

export async function fetchReport(report: ReportDefinition, params: Record<string, string | number>): Promise<ReportResult> {
  const response = await http.get<ApiSuccess<unknown>>(`/reports/${report.id}`, { params });
  return normalizeReport(requireData(response.data.data, "Report"), report.columns);
}

export async function downloadReportCsv(report: ReportDefinition, params: Record<string, string | number>): Promise<void> {
  const exportParams = { ...params };
  delete exportParams.page;
  delete exportParams.limit;
  try {
    const response = await http.get<Blob>(`/reports/${report.id}.csv`, {
      params: exportParams,
      responseType: "blob",
    });
    const blob = response.data;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report.id}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
      const text = await error.response.data.text();
      let message = "The report could not be exported.";
      try {
        const parsed = JSON.parse(text) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        message = "The report could not be exported.";
      }
      throw new Error(message);
    }
    throw error;
  }
}
