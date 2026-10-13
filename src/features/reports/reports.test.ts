import { describe, expect, it } from "vitest";
import { reportById, reportsFor, type ReportDefinition } from "./display";
import { normalizeReport } from "./normalize";
import { parseReportFilters, reportRequestParams, reportSearch } from "./query";

const attendance = reportsFor("student").find((report) => report.id === "attendance") as ReportDefinition;

describe("reports", () => {
  it("limits categories by persona", () => {
    expect(reportsFor("admin").map((report) => report.id)).toEqual(["classes", "enrollment", "attendance", "grades", "fees"]);
    expect(reportsFor("teacher").map((report) => report.id)).toContain("enrollment");
    expect(reportsFor("student").map((report) => report.id)).not.toContain("enrollment");
    expect(reportsFor("unscoped")).toEqual([]);
    expect(reportById("enrollment", "student")).toBeNull();
  });

  it("keeps the selected filters for the report and the export", () => {
    const filters = parseReportFilters(new URLSearchParams("academicYear=2026&from=2026-02-01&to=2026-02-28&status=present&page=2&run=1"));
    expect(reportSearch(filters, attendance, true)).toBe("?run=1&status=present&from=2026-02-01&to=2026-02-28&page=2");
    expect(reportRequestParams(filters, attendance)).toMatchObject({
      status: "present",
      from: "2026-02-01",
      to: "2026-02-28",
      page: 2,
      limit: 20,
    });
    expect(reportRequestParams(filters, attendance)).not.toHaveProperty("academicYear");
  });

  it("reads summary counts and rejects a response that is not a report", () => {
    const result = normalizeReport(
      {
        rows: [{ date: "2026-02-02", status: "present", studentName: "Omar Khan", studentCode: "STU-1", className: "Grade 6", section: "A", note: "" }],
        summary: { total: 1, present: 1, absent: 0, late: 0, excused: 0 },
        total: 1,
        page: 1,
        totalPages: 1,
      },
      attendance.columns,
    );
    expect(result.summary).toEqual(
      expect.arrayContaining([
        { label: "Rows", value: "1" },
        { label: "Present", value: "1" },
      ]),
    );
    expect(result.rows).toHaveLength(1);
    expect(() => normalizeReport({ records: [] }, attendance.columns)).toThrow(/not valid/);
  });
});
