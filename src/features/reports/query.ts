import type { ReportDefinition } from "./display";
import type { ReportFilters } from "./types";

export const emptyReportFilters = (): ReportFilters => ({
  academicYear: "",
  classId: "",
  studentId: "",
  status: "",
  subject: "",
  term: "",
  from: "",
  to: "",
  page: 1,
});

export function parseReportFilters(params: URLSearchParams): ReportFilters {
  const page = Number(params.get("page"));
  return {
    academicYear: (params.get("academicYear") ?? "").trim(),
    classId: (params.get("classId") ?? "").trim(),
    studentId: (params.get("studentId") ?? "").trim(),
    status: (params.get("status") ?? "").trim(),
    subject: (params.get("subject") ?? "").trim(),
    term: (params.get("term") ?? "").trim(),
    from: (params.get("from") ?? "").trim(),
    to: (params.get("to") ?? "").trim(),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function reportSearch(filters: ReportFilters, report: ReportDefinition, run: boolean): string {
  const params = new URLSearchParams();
  if (run) params.set("run", "1");
  for (const key of report.filters) {
    if (key === "page") {
      if (filters.page > 1) params.set("page", String(filters.page));
      continue;
    }
    const value = filters[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function reportRequestParams(filters: ReportFilters, report: ReportDefinition): Record<string, string | number> {
  const params: Record<string, string | number> = { page: filters.page, limit: 20 };
  for (const key of report.filters) {
    if (key === "page") continue;
    const value = filters[key];
    if (typeof value === "string" && value) params[key] = value;
  }
  return params;
}
