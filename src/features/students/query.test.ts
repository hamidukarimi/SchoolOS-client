import { describe, expect, it } from "vitest";
import { parseStudentListQuery, studentListSearch } from "./query";
import { toStudentUpdatePayload } from "./schemas";

describe("student list query", () => {
  it("keeps a supported search, status, and page", () => {
    const query = parseStudentListQuery(new URLSearchParams("search= amina &status=active&page=2"));
    expect(query).toEqual({ search: "amina", status: "active", page: 2 });
    expect(studentListSearch(query)).toBe("?search=amina&status=active&page=2");
  });

  it("drops an unknown status and an invalid page", () => {
    expect(parseStudentListQuery(new URLSearchParams("status=teacher&page=0"))).toEqual({
      search: "",
      status: "",
      page: 1,
    });
  });

  it("omits a blank parent email and still sends a cleared phone", () => {
    expect(
      toStudentUpdatePayload({
        firstName: "Amina",
        lastName: "Noori",
        dateOfBirth: "2012-04-03",
        gender: "female",
        phone: "  ",
        address: "Kabul",
        parentName: "Laila",
        parentPhone: "0700",
        parentEmail: "",
        status: "active",
      }),
    ).toEqual({
      firstName: "Amina",
      lastName: "Noori",
      dateOfBirth: "2012-04-03",
      gender: "female",
      phone: "",
      address: "Kabul",
      parentName: "Laila",
      parentPhone: "0700",
      status: "active",
    });
  });
});
