import type { SchoolPersona } from "../access/types";
import { REPORT_IDS, type ReportColumn, type ReportFilters, type ReportId } from "./types";

export interface ReportDefinition {
  id: ReportId;
  title: string;
  description: string;
  personas: Array<Exclude<SchoolPersona, "unscoped">>;
  filters: Array<keyof ReportFilters>;
  statuses: string[];
  columns: ReportColumn[];
}

const school: ReportDefinition["personas"] = ["admin", "teacher", "student"];
const staff: ReportDefinition["personas"] = ["admin", "teacher"];

export const REPORTS: ReportDefinition[] = [
  {
    id: "classes",
    title: "Classes",
    description: "Class list with the number of students on each class roster.",
    personas: school,
    filters: ["academicYear", "status", "page"],
    statuses: ["active", "inactive"],
    columns: [
      { key: "name", label: "Class" },
      { key: "section", label: "Section" },
      { key: "grade", label: "Grade" },
      { key: "academicYear", label: "Academic year" },
      { key: "status", label: "Status" },
      { key: "studentCount", label: "Students" },
      { key: "capacity", label: "Capacity" },
    ],
  },
  {
    id: "enrollment",
    title: "Enrollment",
    description: "Students listed from class rosters, not from a stored class field.",
    personas: staff,
    filters: ["academicYear", "classId", "status", "page"],
    statuses: ["active", "inactive", "suspended", "graduated"],
    columns: [
      { key: "studentCode", label: "Student ID" },
      { key: "firstName", label: "First name" },
      { key: "lastName", label: "Last name" },
      { key: "status", label: "Status" },
      { key: "className", label: "Class" },
      { key: "section", label: "Section" },
      { key: "grade", label: "Grade" },
      { key: "academicYear", label: "Academic year" },
    ],
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Attendance records and counts for the selected dates.",
    personas: school,
    filters: ["classId", "studentId", "status", "from", "to", "page"],
    statuses: ["present", "absent", "late", "excused"],
    columns: [
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "studentName", label: "Student" },
      { key: "studentCode", label: "Student ID" },
      { key: "className", label: "Class" },
      { key: "section", label: "Section" },
      { key: "note", label: "Note" },
    ],
  },
  {
    id: "grades",
    title: "Grades",
    description: "Recorded marks. The grade letter is the value stored with the record.",
    personas: school,
    filters: ["academicYear", "classId", "studentId", "subject", "page"],
    statuses: [],
    columns: [
      { key: "studentName", label: "Student" },
      { key: "studentCode", label: "Student ID" },
      { key: "className", label: "Class" },
      { key: "subject", label: "Subject" },
      { key: "examTitle", label: "Exam" },
      { key: "academicYear", label: "Academic year" },
      { key: "marksObtained", label: "Marks" },
      { key: "totalMarks", label: "Total marks" },
      { key: "grade", label: "Grade" },
    ],
  },
  {
    id: "fees",
    title: "Fees",
    description: "Fee totals use amount minus paid amount, including a negative result when the amount is lower than the amount paid.",
    personas: school,
    filters: ["academicYear", "term", "studentId", "status", "page"],
    statuses: ["pending", "partial", "paid", "overdue"],
    columns: [
      { key: "studentName", label: "Student" },
      { key: "studentCode", label: "Student ID" },
      { key: "title", label: "Title" },
      { key: "academicYear", label: "Academic year" },
      { key: "term", label: "Term" },
      { key: "status", label: "Status" },
      { key: "amount", label: "Amount" },
      { key: "paidAmount", label: "Paid" },
      { key: "outstanding", label: "Outstanding" },
      { key: "dueDate", label: "Due date" },
    ],
  },
];

export function reportsFor(persona: SchoolPersona | undefined): ReportDefinition[] {
  if (!persona || persona === "unscoped") return [];
  return REPORTS.filter((report) => report.personas.includes(persona));
}

export function reportById(id: string, persona: SchoolPersona | undefined): ReportDefinition | null {
  if (!(REPORT_IDS as readonly string[]).includes(id)) return null;
  return reportsFor(persona).find((report) => report.id === id) ?? null;
}

export function reportIntro(persona: SchoolPersona | undefined): string {
  if (persona === "admin") return "These reports use the school records you can already open. Export downloads the same filtered rows as CSV.";
  if (persona === "teacher") return "Reports include your classes and the students on those class lists.";
  if (persona === "student") return "Reports include your classes, attendance, grades, and fees. Enrollment for the whole class list is not included.";
  return "Reports are not available for this account.";
}
