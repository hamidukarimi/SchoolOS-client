import { describe, expect, it } from "vitest";
import { profileBelongsToAccount, resolveAccess } from "./resolve-access";
import type { SchoolProbe } from "./types";

const account = {
  id: "user-1",
  email: "teacher@school.test",
  role: "user",
};

const noAccess: SchoolProbe = { status: "no-access" };
const failed: SchoolProbe = { status: "failed", message: "Could not reach the server." };

describe("resolveAccess", () => {
  it("identifies an administrator only from the account role", () => {
    const resolution = resolveAccess({
      account: { ...account, role: "admin" },
      teachers: noAccess,
      students: noAccess,
    });

    expect(resolution).toEqual({
      ok: true,
      context: { accountRole: "admin", persona: "admin" },
    });
  });

  it("does not treat a signed-in user as a teacher without a linked profile", () => {
    const resolution = resolveAccess({
      account,
      teachers: noAccess,
      students: null,
    });

    expect(resolution).toEqual({
      ok: true,
      context: { accountRole: "user", persona: "unscoped" },
    });
  });

  it("uses a teacher profile when that profile belongs to the account", () => {
    const resolution = resolveAccess({
      account,
      teachers: {
        status: "ok",
        records: [{ profileId: "teacher-doc", userId: { id: "user-1", email: account.email } }],
      },
      students: {
        status: "ok",
        records: [{ profileId: "student-doc", userId: { id: "user-1" } }],
      },
    });

    expect(resolution).toEqual({
      ok: true,
      context: {
        accountRole: "user",
        persona: "teacher",
        teacherProfileId: "teacher-doc",
      },
    });
  });

  it("uses a student profile when the teacher list belongs to other people", () => {
    const resolution = resolveAccess({
      account: { ...account, email: "student@school.test" },
      teachers: {
        status: "ok",
        records: [{ profileId: "other-teacher", userId: { id: "teacher-user" } }],
      },
      students: {
        status: "ok",
        records: [
          {
            profileId: "student-doc",
            userId: { id: "user-1", email: "student@school.test" },
          },
        ],
      },
    });

    expect(resolution.ok).toBe(true);
    if (resolution.ok) {
      expect(resolution.context.persona).toBe("student");
      expect(resolution.context.studentProfileId).toBe("student-doc");
    }
  });

  it("recognizes a student whose class has no visible teachers", () => {
    const resolution = resolveAccess({
      account,
      teachers: { status: "ok", records: [] },
      students: {
        status: "ok",
        records: [{ profileId: "student-doc", userId: "user-1" }],
      },
    });

    expect(resolution.ok).toBe(true);
    if (resolution.ok) expect(resolution.context.persona).toBe("student");
  });

  it("does not grant school access when a probe fails", () => {
    const resolution = resolveAccess({
      account,
      teachers: failed,
      students: null,
    });

    expect(resolution.ok).toBe(false);
  });

  it("matches a populated user by email when the id is absent", () => {
    expect(
      profileBelongsToAccount(
        { email: "Teacher@school.test" },
        { id: "user-1", email: "teacher@school.test" },
      ),
    ).toBe(true);
  });
});
