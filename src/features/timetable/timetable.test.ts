import { describe, expect, it } from "vitest";
import { canManageTimetable, groupTimetableByDay } from "./display";
import { normalizeTimetable, normalizeTimetableList } from "./normalize";
import { parseTimetableListQuery, timetableListQueryForPersona, timetableListSearch } from "./query";
import { timetableFormSchema, toTimetableCreatePayload, toTimetableUpdatePayload } from "./schemas";
import type { TimetableRecord } from "./types";

const entry = {
  _id: "slot-1",
  classId: { _id: "class-1", name: "Grade 6", section: "A", grade: "6" },
  teacherId: { _id: "teacher-1", firstName: "Karim", lastName: "Rahimi", teacherId: "TCH-1", subject: "Mathematics" },
  subject: "Mathematics",
  dayOfWeek: "monday",
  startTime: "09:00",
  endTime: "09:45",
  room: "12",
  academicYear: "2026-2027",
  status: "active",
};

const form = {
  classId: "class-1",
  teacherId: "teacher-1",
  subject: " Mathematics ",
  dayOfWeek: "monday" as const,
  startTime: " 09:00 ",
  endTime: " 09:45 ",
  room: "  ",
  academicYear: " 2026-2027 ",
  status: "active" as const,
};

function record(day: TimetableRecord["dayOfWeek"], id: string): TimetableRecord {
  return {
    id,
    classRef: null,
    teacher: null,
    subject: "Mathematics",
    dayOfWeek: day,
    startTime: "09:00",
    endTime: "09:45",
    room: "",
    academicYear: "2026-2027",
    status: "active",
  };
}

describe("normalizeTimetable", () => {
  it("reads populated class and teacher names", () => {
    expect(normalizeTimetable(entry)).toMatchObject({
      id: "slot-1",
      classRef: { id: "class-1", name: "Grade 6", section: "A" },
      teacher: { id: "teacher-1", teacherId: "TCH-1" },
      dayOfWeek: "monday",
      room: "12",
      status: "active",
    });
  });

  it("ignores raw ids and rejects an unknown day or status", () => {
    expect(normalizeTimetable({ ...entry, classId: "class-1", teacherId: "teacher-1" })).toMatchObject({
      classRef: null,
      teacher: null,
    });
    expect(() => normalizeTimetable({ ...entry, dayOfWeek: "saturday" })).toThrow(/day/);
    expect(() => normalizeTimetable({ ...entry, status: "cancelled" })).toThrow(/status/);
  });
});

describe("timetable list", () => {
  it("reads the timetable collection", () => {
    expect(normalizeTimetableList({ timetables: [entry], total: 1, page: 1, totalPages: 1 }).timetables).toHaveLength(1);
    expect(() => normalizeTimetableList({ exams: [] })).toThrow(/not valid/);
  });

  it("keeps a weekday and academic year and drops an unsupported day", () => {
    const query = parseTimetableListQuery(new URLSearchParams("dayOfWeek=friday&academicYear=2026-2027&classId=class-1&page=2"));
    expect(query).toMatchObject({ dayOfWeek: "friday", academicYear: "2026-2027", classId: "class-1", page: 2 });
    expect(parseTimetableListQuery(new URLSearchParams("dayOfWeek=saturday")).dayOfWeek).toBe("");
    expect(timetableListSearch(query)).toBe("?classId=class-1&dayOfWeek=friday&academicYear=2026-2027&page=2");
  });

  it("does not send a class filter for a student, because the server replaces it", () => {
    const query = parseTimetableListQuery(new URLSearchParams("classId=other-class&dayOfWeek=monday"));
    expect(timetableListQueryForPersona(query, "student").classId).toBe("");
    expect(timetableListQueryForPersona(query, "teacher").classId).toBe("other-class");
  });

  it("groups a page from Monday through Friday", () => {
    const groups = groupTimetableByDay([record("friday", "f"), record("monday", "m"), record("friday", "f2")]);
    expect(groups.map((group) => group.day)).toEqual(["monday", "friday"]);
    expect(groups[1]?.entries).toHaveLength(2);
  });
});

describe("timetable permissions and payloads", () => {
  it("lets only an administrator change the timetable", () => {
    expect(canManageTimetable("admin")).toBe(true);
    expect(canManageTimetable("teacher")).toBe(false);
    expect(canManageTimetable("student")).toBe(false);
    expect(canManageTimetable("unscoped")).toBe(false);
  });

  it("omits a blank room and rejects Saturday", () => {
    expect(toTimetableCreatePayload(form)).toEqual({
      classId: "class-1",
      teacherId: "teacher-1",
      subject: "Mathematics",
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "09:45",
      academicYear: "2026-2027",
      status: "active",
    });
    expect(timetableFormSchema.shape.dayOfWeek.safeParse("saturday").success).toBe(false);
    expect(timetableFormSchema.shape.startTime.safeParse("").success).toBe(false);
  });

  it("sends a cleared room on update", () => {
    expect(toTimetableUpdatePayload(form).room).toBe("");
  });
});
