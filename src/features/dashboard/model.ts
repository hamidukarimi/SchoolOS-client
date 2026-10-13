import type { SchoolPersona } from "../access/types";

export const DASHBOARD_WIDGETS = [
  "students",
  "teachers",
  "classes",
  "attendance",
  "attendance-summary",
  "grade-summary",
  "exams",
  "timetable",
] as const;

export type DashboardWidget = (typeof DASHBOARD_WIDGETS)[number];

export function dashboardWidgets(persona: SchoolPersona): DashboardWidget[] {
  if (persona === "admin") return ["students", "teachers", "classes", "attendance", "exams", "timetable"];
  if (persona === "teacher") return ["students", "classes", "attendance", "exams", "timetable"];
  if (persona === "student") return ["classes", "attendance-summary", "grade-summary", "exams", "timetable"];
  return [];
}

export function readListTotal(value: unknown, collection: string): number {
  if (!value || typeof value !== "object") {
    throw new Error("Dashboard response was not valid.");
  }
  const record = value as Record<string, unknown>;
  if (!Array.isArray(record[collection])) {
    throw new Error("Dashboard response was not valid.");
  }
  if (typeof record.total !== "number" || !Number.isFinite(record.total)) {
    throw new Error("Dashboard response did not include a total.");
  }
  return record.total;
}

export function totalCardCopy(
  persona: SchoolPersona,
  collection: "students" | "teachers" | "classes",
): { label: string; hint: string; to: string } {
  if (collection === "students" && persona === "teacher") {
    return { label: "Students", hint: "Students on your class lists.", to: "/app/students" };
  }
  if (collection === "classes" && persona === "teacher") {
    return { label: "Classes", hint: "Classes you teach.", to: "/app/classes" };
  }
  if (collection === "classes" && persona === "student") {
    return { label: "Classes", hint: "Classes linked to your student record.", to: "/app/classes" };
  }
  const label = collection === "students" ? "Students" : collection === "teachers" ? "Teachers" : "Classes";
  const to = collection === "students" ? "/app/students" : collection === "teachers" ? "/app/teachers" : "/app/classes";
  return { label, hint: "The total returned for this account.", to };
}

export function attendanceShare(counts: { present: number; late: number; total: number }): number | null {
  if (counts.total <= 0) return null;
  return Math.round(((counts.present + counts.late) / counts.total) * 10000) / 100;
}
