import type { AccessContext, AccountRole, SchoolProbe } from "./types";

export interface AccessAccount {
  id: string;
  email: string;
  role: string;
}

export type AccessResolution =
  | { ok: true; context: AccessContext }
  | { ok: false; message: string };

export function linkedAccountId(userId: unknown): string | null {
  if (typeof userId === "string" && userId) return userId;
  if (!userId || typeof userId !== "object") return null;

  const record = userId as { id?: unknown; _id?: unknown };
  if (typeof record.id === "string" && record.id) return record.id;
  if (typeof record._id === "string" && record._id) return record._id;
  return null;
}

export function profileBelongsToAccount(
  userId: unknown,
  account: Pick<AccessAccount, "id" | "email">,
): boolean {
  const linkedId = linkedAccountId(userId);
  if (linkedId && linkedId === account.id) return true;

  if (!userId || typeof userId !== "object" || !("email" in userId)) return false;
  const email = (userId as { email?: unknown }).email;
  return (
    typeof email === "string" &&
    email.toLowerCase() === account.email.toLowerCase()
  );
}

function matchingProfile(
  probe: SchoolProbe,
  account: AccessAccount,
): { profileId: string } | null {
  if (probe.status !== "ok") return null;
  const match = probe.records.find((record) =>
    profileBelongsToAccount(record.userId, account),
  );
  return match ? { profileId: match.profileId } : null;
}

/**
 * Mirrors backend school scope:
 * admin is only User.role === "admin";
 * a linked Teacher profile is used before a Student profile;
 * no linked profile is unscoped.
 * A failed probe never becomes unscoped.
 */
export function resolveAccess(input: {
  account: AccessAccount;
  teachers: SchoolProbe | null;
  students: SchoolProbe | null;
}): AccessResolution {
  if (input.account.role === "admin") {
    return {
      ok: true,
      context: { accountRole: "admin", persona: "admin" },
    };
  }

  if (input.account.role !== "user") {
    return {
      ok: false,
      message: "The account role from the server could not be recognized.",
    };
  }

  const accountRole: AccountRole = "user";
  const teachers = input.teachers;

  if (!teachers || teachers.status === "failed") {
    return {
      ok: false,
      message: teachers?.status === "failed"
        ? teachers.message
        : "School access could not be verified.",
    };
  }

  if (teachers.status === "no-access") {
    return {
      ok: true,
      context: { accountRole, persona: "unscoped" },
    };
  }

  const teacherProfile = matchingProfile(teachers, input.account);
  if (teacherProfile) {
    return {
      ok: true,
      context: {
        accountRole,
        persona: "teacher",
        teacherProfileId: teacherProfile.profileId,
      },
    };
  }

  const students = input.students;
  if (!students || students.status === "failed") {
    return {
      ok: false,
      message: students?.status === "failed"
        ? students.message
        : "School access could not be verified.",
    };
  }

  if (students.status === "no-access") {
    return {
      ok: false,
      message: "School access could not be verified.",
    };
  }

  const studentProfile = matchingProfile(students, input.account);
  if (!studentProfile) {
    return {
      ok: false,
      message: "School access could not be verified.",
    };
  }

  return {
    ok: true,
    context: {
      accountRole,
      persona: "student",
      studentProfileId: studentProfile.profileId,
    },
  };
}
