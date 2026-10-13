export const REPORT_IDS = ["classes", "enrollment", "attendance", "grades", "fees"] as const;

export type ReportId = (typeof REPORT_IDS)[number];

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportSummaryItem {
  label: string;
  value: string;
}

export interface ReportResult {
  columns: ReportColumn[];
  rows: Array<Record<string, string | number>>;
  summary: ReportSummaryItem[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ReportFilters {
  academicYear: string;
  classId: string;
  studentId: string;
  status: string;
  subject: string;
  term: string;
  from: string;
  to: string;
  page: number;
}
