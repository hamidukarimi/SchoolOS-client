import { describe, expect, it } from "vitest";
import { accountLinkState } from "../accounts/api";
import { canManageTeachers } from "./display";
import { toTeacherCreatePayload } from "./schemas";

describe("create teacher", () => {
  it("submits the selected account id without assigning a class", () => {
    expect(
      toTeacherCreatePayload({
        userId: "64b000000000000000000002",
        teacherId: " TCH-4 ",
        firstName: "Layla",
        lastName: "Noori",
        dateOfBirth: "1991-02-02",
        gender: "female",
        phone: "",
        address: "",
        subject: "Mathematics",
        qualification: "",
        experience: "",
        salary: "",
        joinDate: "",
        status: "active",
      }),
    ).toMatchObject({
      userId: "64b000000000000000000002",
      teacherId: "TCH-4",
      subject: "Mathematics",
    });
    expect(toTeacherCreatePayload({
      userId: "64b000000000000000000002",
      teacherId: "TCH-4",
      firstName: "Layla",
      lastName: "Noori",
      dateOfBirth: "1991-02-02",
      gender: "female",
      phone: "",
      address: "",
      subject: "",
      qualification: "",
      experience: "",
      salary: "",
      joinDate: "",
      status: "active",
    })).not.toHaveProperty("classId");
  });

  it("keeps creation controls for administrators and blocks a linked teaching account", () => {
    expect(canManageTeachers("admin")).toBe(true);
    expect(canManageTeachers("teacher")).toBe(false);
    expect(canManageTeachers("student")).toBe(false);
    expect(
      accountLinkState(
        {
          id: "1",
          firstname: "Layla",
          lastname: "Noori",
          username: "layla",
          email: "layla@example.com",
          hasStudentProfile: false,
          hasTeacherProfile: true,
        },
        "teacher",
      ).reason,
    ).toMatch(/teacher profile/);
  });
});
