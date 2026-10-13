import { describe, expect, it } from "vitest";
import { accountLinkState } from "../accounts/api";
import { canManageStaff } from "./display";
import { normalizeStaff, normalizeStaffList, normalizeStaffSummary } from "./normalize";
import { parseStaffListQuery, staffListSearch } from "./query";
import { toStaffCreatePayload } from "./schemas";

const staff = {
  _id: "staff-1",
  staffId: "STF-1",
  firstName: "Laila",
  lastName: "Noori",
  dateOfBirth: "1992-03-04T00:00:00.000Z",
  gender: "female",
  department: "Office",
  position: "Registrar",
  salary: 1200,
  joinDate: "2024-01-15T00:00:00.000Z",
  contractType: "full-time",
  status: "active",
  userId: { id: "user-1", email: "laila@example.com" },
};

describe("staff records", () => {
  it("reads a staff member, the directory, and the summary", () => {
    expect(normalizeStaff(staff).account).toEqual({ id: "user-1", email: "laila@example.com" });
    expect(normalizeStaffList({ staff: [staff], total: 1, page: 1, totalPages: 1 }).staff).toHaveLength(1);
    expect(
      normalizeStaffSummary({
        total: 2,
        byStatus: { active: 1, inactive: 1, suspended: 0, terminated: 0 },
        byContractType: { fullTime: 1, partTime: 0, contract: 1 },
        totalMonthlySalary: 1200,
      }),
    ).toMatchObject({ total: 2, totalMonthlySalary: 1200, byStatus: { active: 1 } });
  });

  it("rejects an unknown status and a response that is not a list", () => {
    expect(() => normalizeStaff({ ...staff, status: "retired" })).toThrow(/status/);
    expect(() => normalizeStaffList({ records: [] })).toThrow(/not valid/);
  });

  it("keeps supported directory filters and administrator-only management", () => {
    const query = parseStaffListQuery(
      new URLSearchParams("search=Laila&department=Office&status=active&contractType=full-time&page=2"),
    );
    expect(staffListSearch(query)).toBe("?search=Laila&department=Office&status=active&contractType=full-time&page=2");
    expect(canManageStaff("admin")).toBe(true);
    expect(canManageStaff("teacher")).toBe(false);
    expect(canManageStaff("student")).toBe(false);
    expect(canManageStaff("unscoped")).toBe(false);
  });

  it("submits the account id and does not grant a teacher or student profile", () => {
    const payload = toStaffCreatePayload({
      userId: "64b000000000000000000003",
      staffId: " STF-9 ",
      firstName: "Laila",
      lastName: "Noori",
      dateOfBirth: "1992-03-04",
      gender: "female",
      phone: "",
      address: "",
      department: "Office",
      position: "Registrar",
      salary: "1200",
      joinDate: "",
      contractType: "full-time",
      status: "active",
    });
    expect(payload.userId).toBe("64b000000000000000000003");
    expect(payload.staffId).toBe("STF-9");
    expect(payload.salary).toBe(1200);
    expect(payload).not.toHaveProperty("joinDate");
    expect(payload).not.toHaveProperty("role");
    expect(
      accountLinkState(
        {
          id: "user-1",
          firstname: "Laila",
          lastname: "Noori",
          username: "laila",
          email: "laila@example.com",
          hasStudentProfile: true,
          hasTeacherProfile: true,
        },
        "staff",
      ).disabled,
    ).toBe(false);
  });
});
