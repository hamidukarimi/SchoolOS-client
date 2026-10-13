import { describe, expect, it } from "vitest";
import { canManageTeachers, teacherEmptyMessage, teacherListIntroduction } from "./display";
import { parseTeacherListQuery, teacherListSearch } from "./query";
import { teacherFormSchema, toTeacherUpdatePayload } from "./schemas";

describe("teacher list query", () => {
  it("keeps search, a teacher status, and page", () => {
    const query = parseTeacherListQuery(
      new URLSearchParams("search= mathematics &status=suspended&page=2"),
    );
    expect(query).toEqual({ search: "mathematics", status: "suspended", page: 2 });
    expect(teacherListSearch(query)).toBe("?search=mathematics&status=suspended&page=2");
  });

  it("drops a student status and an invalid page", () => {
    expect(parseTeacherListQuery(new URLSearchParams("status=graduated&page=-1"))).toEqual({
      search: "",
      status: "",
      page: 1,
    });
  });
});

describe("teacher update payload", () => {
  it("rejects a negative number and accepts zero", () => {
    expect(teacherFormSchema.shape.experience.safeParse("-1").success).toBe(false);
    expect(teacherFormSchema.shape.salary.safeParse("0").success).toBe(true);
    expect(teacherFormSchema.shape.status.safeParse("graduated").success).toBe(false);
  });

  it("omits blank numbers and a blank join date, and sends zero", () => {
    expect(
      toTeacherUpdatePayload({
        firstName: "Karim",
        lastName: "Rahimi",
        dateOfBirth: "1988-01-12",
        gender: "male",
        phone: "",
        address: "",
        subject: "Mathematics",
        qualification: "",
        experience: "0",
        salary: " ",
        joinDate: "",
        status: "inactive",
      }),
    ).toEqual({
      firstName: "Karim",
      lastName: "Rahimi",
      dateOfBirth: "1988-01-12",
      gender: "male",
      phone: "",
      address: "",
      subject: "Mathematics",
      qualification: "",
      experience: 0,
      status: "inactive",
    });
  });
});

describe("teacher access copy", () => {
  it("lets only an administrator manage teachers", () => {
    expect(canManageTeachers("admin")).toBe(true);
    expect(canManageTeachers("teacher")).toBe(false);
    expect(canManageTeachers("student")).toBe(false);
    expect(canManageTeachers("unscoped")).toBe(false);
  });

  it("describes each persona's teacher scope", () => {
    expect(teacherListIntroduction("teacher")).toMatch(/linked to your account/);
    expect(teacherListIntroduction("student")).toMatch(/assigned to your classes/);
    expect(teacherListIntroduction("admin")).toMatch(/account that already exists/);
    expect(teacherEmptyMessage("student", false)).toMatch(/assigned to your classes/);
  });
});
