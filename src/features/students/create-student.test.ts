import { describe, expect, it } from "vitest";
import { accountLinkState, normalizeAccountSearch } from "../accounts/api";
import { toStudentCreatePayload } from "./schemas";

describe("create student", () => {
  it("submits the selected account id and does not invent a class", () => {
    expect(
      toStudentCreatePayload({
        userId: "64b000000000000000000001",
        studentId: " STU-12 ",
        firstName: "Omar",
        lastName: "Khan",
        dateOfBirth: "2012-04-01",
        gender: "male",
        phone: "",
        address: "",
        parentName: "Parent",
        parentPhone: "0700000000",
        parentEmail: "",
        status: "active",
      }),
    ).toEqual({
      userId: "64b000000000000000000001",
      studentId: "STU-12",
      firstName: "Omar",
      lastName: "Khan",
      dateOfBirth: "2012-04-01",
      gender: "male",
      phone: "",
      address: "",
      parentName: "Parent",
      parentPhone: "0700000000",
      status: "active",
    });
  });

  it("marks an account that already has a student profile as unavailable", () => {
    const account = normalizeAccountSearch({
      users: [
        {
          id: "64b000000000000000000001",
          firstname: "Omar",
          lastname: "Khan",
          username: "omar12",
          email: "omar@gmail.com",
          hasStudentProfile: true,
          hasTeacherProfile: false,
        },
      ],
      total: 1,
      page: 1,
      totalPages: 1,
    }).users[0];
    expect(account).toBeDefined();
    if (!account) return;
    expect(accountLinkState(account, "student").disabled).toBe(true);
    expect(accountLinkState(account, "teacher").disabled).toBe(false);
    expect(account).not.toHaveProperty("password");
  });
});
