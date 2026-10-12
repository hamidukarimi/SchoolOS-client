export type AccountRole = "admin" | "user";

export type SchoolPersona = "admin" | "teacher" | "student" | "unscoped";

export interface AccessContext {
  accountRole: AccountRole;
  persona: SchoolPersona;
  teacherProfileId?: string;
  studentProfileId?: string;
}

export interface LinkedProfileRecord {
  profileId: string;
  userId: unknown;
}

export type SchoolProbe =
  | { status: "ok"; records: LinkedProfileRecord[] }
  | { status: "no-access" }
  | { status: "failed"; message: string };

export const NO_SCHOOL_ACCESS_MESSAGE =
  "You do not have access to school data. Use an admin account or a user linked to a student or teacher profile.";
