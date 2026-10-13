import type { ReportColumn, ReportResult, ReportSummaryItem } from "./types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readCount(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readCell(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value;
  return "";
}

function summaryItem(label: string, value: unknown): ReportSummaryItem {
  if (typeof value === "number" && Number.isFinite(value)) return { label, value: String(value) };
  if (value === null) return { label, value: "Not available" };
  return { label, value: "" };
}

export function normalizeReport(value: unknown, columns: ReportColumn[]): ReportResult {
  if (!isRecord(value) || !Array.isArray(value.rows) || !isRecord(value.summary)) {
    throw new Error("Report response was not valid.");
  }
  const summary = value.summary;
  const items: ReportSummaryItem[] = [summaryItem("Rows", value.total)];
  if ("studentCount" in summary) items.push(summaryItem("Students on rosters", summary.studentCount));
  if ("present" in summary) {
    items.push(summaryItem("Present", summary.present));
    items.push(summaryItem("Absent", summary.absent));
    items.push(summaryItem("Late", summary.late));
    items.push(summaryItem("Excused", summary.excused));
  }
  if ("averagePercentage" in summary) items.push(summaryItem("Average percentage", summary.averagePercentage));
  if ("totalAmount" in summary) {
    items.push(summaryItem("Total amount", summary.totalAmount));
    items.push(summaryItem("Total paid", summary.totalPaid));
    items.push(summaryItem("Total pending", summary.totalPending));
  }
  return {
    columns,
    rows: value.rows.map((row) => {
      if (!isRecord(row)) throw new Error("Report response was not valid.");
      const record: Record<string, string | number> = {};
      for (const column of columns) record[column.key] = readCell(row[column.key]);
      return record;
    }),
    summary: items,
    total: readCount(value.total),
    page: typeof value.page === "number" && value.page > 0 ? value.page : 1,
    totalPages: readCount(value.totalPages),
  };
}
