import { describe, expect, it } from "vitest";
import { accountDirectoryCopy, canManageAccounts, linkedProfileSummary } from "./display";
import { normalizeAccount, normalizeAccountList } from "./normalize";
import { accountListSearch, parseAccountListQuery } from "./query";
import { createAccountFormSchema, editAccountFormSchema, toAccountCreatePayload, toAccountUpdatePayload } from "./schemas";

const row = {
  id: "user-1",
  firstname: "Laila",
  lastname: "Noori",
  username: "laila",
  email: "laila@example.com",
  role: "user",
  isActive: true,
  hasStudentProfile: true,
  hasTeacherProfile: false,
  hasStaffRecord: true,
  password: "secret",
  passwordResetToken: "reset-token",
};

describe("account management", () => {
  it("reads a directory and a detail record without secrets", () => {
    expect(normalizeAccountList({ accounts: [row], total: 1, page: 1, totalPages: 1 }).accounts[0]).not.toHaveProperty("password");
    const detail = normalizeAccount({
      account: {
        ...row,
        isVerified: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
        studentProfileId: "student-1",
      },
    });
    expect(detail.studentProfileId).toBe("student-1");
    expect(detail.isVerified).toBe(false);
    expect(detail).not.toHaveProperty("password");
    expect(detail).not.toHaveProperty("passwordResetToken");
  });

  it("rejects an unknown role and a response that is not a list", () => {
    expect(() => normalizeAccountList({ users: [] })).toThrow(/not valid/);
    expect(() => normalizeAccount({ ...row, role: "teacher", isVerified: false, createdAt: "2026-01-01", updatedAt: "2026-01-02" })).toThrow(/role/);
  });

  it("keeps supported filters, empty copy, and administrator-only management", () => {
    const query = parseAccountListQuery(new URLSearchParams("search=Laila&role=admin&status=inactive&page=2"));
    expect(accountListSearch(query)).toBe("?search=Laila&role=admin&status=inactive&page=2");
    expect(parseAccountListQuery(new URLSearchParams("role=teacher&status=graduated")).role).toBe("");
    expect(parseAccountListQuery(new URLSearchParams("role=teacher&status=graduated")).status).toBe("");
    expect(canManageAccounts("admin")).toBe(true);
    expect(canManageAccounts("teacher")).toBe(false);
    expect(canManageAccounts("student")).toBe(false);
    expect(canManageAccounts("unscoped")).toBe(false);
    expect(accountDirectoryCopy("loading")).toBe("Loading accounts");
    expect(accountDirectoryCopy("error")).toBe("Accounts could not be loaded.");
    expect(accountDirectoryCopy("empty")).toBe("There are no accounts yet.");
    expect(accountDirectoryCopy("filtered")).toBe("No accounts match these filters.");
    expect(linkedProfileSummary({ hasStudentProfile: false, hasTeacherProfile: false, hasStaffRecord: false })).toBe(
      "No student, teacher, or staff record",
    );
  });

  it("creates a login payload and keeps role changes off the signed-in administrator", () => {
    const created = toAccountCreatePayload({
      firstname: "Laila",
      lastname: "Noori",
      username: "laila",
      email: "laila@example.com",
      password: "password1",
      birthday: "",
      gender: "",
      city: "",
      country: "",
      role: "user",
    });
    expect(created).toMatchObject({ password: "password1", role: "user" });
    expect(created).not.toHaveProperty("birthday");
    expect(created).not.toHaveProperty("isActive");
    expect(
      createAccountFormSchema.safeParse({ ...created, birthday: "", gender: "", city: "", country: "", password: "short" }).success,
    ).toBe(false);

    const locked = toAccountUpdatePayload(
      {
        firstname: "Laila",
        lastname: "Noori",
        username: "laila",
        email: "laila@example.com",
        password: "   ",
        birthday: "",
        gender: "",
        city: "Kabul",
        country: "",
        role: "admin",
        status: "inactive",
      },
      true,
    );
    expect(locked).not.toHaveProperty("password");
    expect(locked).not.toHaveProperty("role");
    expect(locked).not.toHaveProperty("isActive");
    expect(locked.location).toEqual({ city: "Kabul" });

    const editable = toAccountUpdatePayload(
      {
        firstname: "Laila",
        lastname: "Noori",
        username: "laila",
        email: "laila@example.com",
        password: "newpass1",
        birthday: "",
        gender: "female",
        city: "",
        country: "",
        role: "user",
        status: "inactive",
      },
      false,
    );
    expect(editable).toMatchObject({ password: "newpass1", role: "user", isActive: false, gender: "female" });
    expect(
      editAccountFormSchema.safeParse({
        firstname: "Laila",
        lastname: "Noori",
        username: "laila",
        email: "laila@example.com",
        password: "x",
        birthday: "",
        gender: "female",
        city: "",
        country: "",
        role: "user",
        status: "inactive",
      }).success,
    ).toBe(false);
  });
});
