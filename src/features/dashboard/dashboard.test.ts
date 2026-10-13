import { describe, expect, it } from "vitest";
import { formatCalendarDate, localCalendarDate, timetableDayForDate } from "./calendar";
import { attendanceShare, dashboardWidgets, readListTotal, totalCardCopy } from "./model";

describe("dashboard calendar", () => {
  it("uses the local calendar day", () => {
    expect(localCalendarDate(new Date(2026, 9, 13))).toBe("2026-10-13");
    expect(timetableDayForDate(new Date(2026, 9, 13))).toBe("tuesday");
    expect(timetableDayForDate(new Date(2026, 9, 17))).toBeNull();
    expect(formatCalendarDate("2026-10-13")).toContain("2026");
  });
});

describe("dashboard widgets", () => {
  it("gives each persona only the summaries its endpoints can scope", () => {
    expect(dashboardWidgets("admin")).toEqual(["students", "teachers", "classes", "attendance", "exams", "timetable"]);
    expect(dashboardWidgets("teacher")).toEqual(["students", "classes", "attendance", "exams", "timetable"]);
    expect(dashboardWidgets("teacher")).not.toContain("teachers");
    expect(dashboardWidgets("student")).toEqual(["classes", "attendance-summary", "grade-summary", "exams", "timetable"]);
    expect(dashboardWidgets("unscoped")).toEqual([]);
    expect(totalCardCopy("teacher", "students").hint).toBe("Students on your class lists.");
    expect(totalCardCopy("student", "classes").to).toBe("/app/classes");
    expect(totalCardCopy("admin", "teachers").hint).toBe("The total returned for this account.");
  });

  it("reads a list total without using the returned rows as the count", () => {
    expect(readListTotal({ students: [{ id: "only-row" }], total: 40, page: 1, totalPages: 40 }, "students")).toBe(40);
    expect(() => readListTotal({ teachers: [] }, "students")).toThrow(/not valid/);
    expect(() => readListTotal({ classes: [], total: "3" }, "classes")).toThrow(/total/);
  });

  it("calculates the attendance share from the status totals", () => {
    expect(attendanceShare({ present: 8, late: 1, total: 10 })).toBe(90);
    expect(attendanceShare({ present: 0, late: 0, total: 0 })).toBeNull();
  });
});
