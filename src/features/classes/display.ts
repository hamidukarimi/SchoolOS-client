import type { SchoolPersona } from "../access/types";
import type { ClassStatus, ClassTeacherSummary } from "./types";

export interface TeacherChoice {
  id: string;
  label: string;
}

export function canManageClasses(persona: SchoolPersona | undefined): boolean {
  return persona === "admin";
}

export function showsClassSearch(persona: SchoolPersona | undefined): boolean {
  return persona === "admin" || persona === "teacher";
}

export function classListHeading(): string {
  return "Classes";
}

export function classListIntroduction(persona: SchoolPersona | undefined): string {
  if (persona === "admin") {
    return "Review classes and open a class for its teacher and enrolled students. Creating or editing a class does not enroll students.";
  }
  if (persona === "teacher") {
    return "These are the classes where you are the assigned teacher. Only an administrator can change a class.";
  }
  if (persona === "student") {
    return "These are the classes linked to your student profile. Only an administrator can change a class.";
  }
  return "Class records are not available for this account.";
}

export function classEmptyTitle(filtered: boolean): string {
  return filtered ? "No classes match these filters" : "No classes to show";
}

export function classEmptyMessage(persona: SchoolPersona | undefined, filtered: boolean): string {
  if (filtered) return "Try a different name, section, grade, academic year, or status.";
  if (persona === "teacher") return "No classes list you as the assigned teacher.";
  if (persona === "student") return "No classes are linked to your student profile.";
  return "There are no classes in this view.";
}

export function classStatusLabel(status: ClassStatus): string {
  return status === "active" ? "Active" : "Inactive";
}

export function classTeacherLabel(teacher: ClassTeacherSummary | null): string {
  if (!teacher) return "No teacher assigned";
  const name = `${teacher.firstName} ${teacher.lastName}`.trim();
  return teacher.teacherId ? `${name} · ${teacher.teacherId}` : name;
}

export function teacherChoices(
  teachers: ClassTeacherSummary[],
  current: ClassTeacherSummary | null,
): TeacherChoice[] {
  const choices = teachers.map((teacher) => ({
    id: teacher.id,
    label: classTeacherLabel(teacher),
  }));
  if (current && !choices.some((choice) => choice.id === current.id)) {
    choices.unshift({ id: current.id, label: classTeacherLabel(current) });
  }
  return choices;
}

export function readNotice(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("notice" in value)) return null;
  const notice = (value as { notice?: unknown }).notice;
  return typeof notice === "string" && notice.trim() ? notice : null;
}
