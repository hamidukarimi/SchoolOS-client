import { describe, expect, it } from "vitest";
import { announcementListKey, announcementInvalidationKey } from "./api";
import { audienceLabel, canManageAnnouncements } from "./display";
import { normalizeAnnouncement, normalizeAnnouncementList } from "./normalize";
import { announcementListParams, announcementListQueryForPersona, audiencesForPersona, parseAnnouncementListQuery } from "./query";
import { toAnnouncementPayload } from "./schemas";

const record = {
  _id: "64b000000000000000000010",
  title: "Staff meeting",
  content: "Teachers meet at noon.",
  audience: "teachers",
  classId: { _id: "64b000000000000000000020", name: "Grade 6", section: "A", grade: "6" },
  publishedBy: { _id: "64b000000000000000000030", firstname: "Karim", lastname: "Rahimi" },
  publishDate: "2026-10-13T00:00:00.000Z",
  expiryDate: null,
  isPublished: true,
  createdAt: "2026-10-13T00:00:00.000Z",
  updatedAt: "2026-10-13T00:00:00.000Z",
};

describe("announcement responses", () => {
  it("reads a populated announcement and rejects an unknown audience", () => {
    expect(normalizeAnnouncement(record)).toMatchObject({
      id: record._id,
      audience: "teachers",
      classRef: { name: "Grade 6", section: "A" },
      publishedBy: { firstname: "Karim" },
      isPublished: true,
    });
    expect(() => normalizeAnnouncement({ ...record, audience: "staff" })).toThrow(/audience/);
    expect(normalizeAnnouncementList({ announcements: [record], total: 1, page: 1, totalPages: 1 }).announcements).toHaveLength(1);
  });
});

describe("announcement list access", () => {
  it("offers only the audiences each persona can receive", () => {
    expect(audiencesForPersona("admin")).toEqual(["all", "teachers", "students", "parents"]);
    expect(audiencesForPersona("teacher")).toEqual(["all", "teachers"]);
    expect(audiencesForPersona("student")).toEqual(["all", "students"]);
    expect(audiencesForPersona("unscoped")).toEqual(["all"]);
    expect(audienceLabel("parents")).toBe("Parents");
    expect(canManageAnnouncements("admin")).toBe(true);
    expect(canManageAnnouncements("teacher")).toBe(false);
  });

  it("drops audience and draft filters the server would not allow", () => {
    const requested = parseAnnouncementListQuery(new URLSearchParams("audience=teachers&published=false&page=2"));
    expect(announcementListQueryForPersona(requested, "student")).toEqual({
      audience: "",
      classId: "",
      published: "",
      page: 2,
    });
    const params = announcementListParams(announcementListQueryForPersona(requested, "teacher"));
    expect(params).toEqual({ page: 2, limit: 20, audience: "teachers" });
    expect(params).not.toHaveProperty("isPublished");
    expect(announcementListKey({ audience: "", classId: "", published: "", page: 1 })[0]).toBe(announcementInvalidationKey[0]);
  });

  it("does not send an empty class or dates", () => {
    expect(
      toAnnouncementPayload({
        title: " Holiday ",
        content: " Friday ",
        audience: "all",
        classId: "",
        publishDate: "",
        expiryDate: "2026-10-20",
        isPublished: true,
      }),
    ).toEqual({
      title: "Holiday",
      content: "Friday",
      audience: "all",
      isPublished: true,
      expiryDate: "2026-10-20",
    });
    expect(
      toAnnouncementPayload(
        {
          title: "Trip",
          content: "Bring lunch.",
          audience: "students",
          classId: "",
          publishDate: "",
          expiryDate: "",
          isPublished: true,
        },
        "update",
      ).classId,
    ).toBe("");
  });
});
