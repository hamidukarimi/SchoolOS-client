import { z } from "zod";
import { ATTENDANCE_STATUSES, type AttendanceCreatePayload, type AttendanceUpdatePayload } from "./types";

export const recordAttendanceSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  classId: z.string().min(1, "Class ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required"),
  status: z.enum(ATTENDANCE_STATUSES, {
    message: "Status must be present, absent, late or excused",
  }),
  note: z.string(),
});

export const editAttendanceSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES, {
    message: "Status must be present, absent, late or excused",
  }),
  note: z.string(),
});

export type RecordAttendanceValues = z.infer<typeof recordAttendanceSchema>;
export type EditAttendanceValues = z.infer<typeof editAttendanceSchema>;

export function toAttendanceCreatePayload(values: RecordAttendanceValues): AttendanceCreatePayload {
  const payload: AttendanceCreatePayload = {
    studentId: values.studentId,
    classId: values.classId,
    teacherId: values.teacherId,
    date: values.date,
    status: values.status,
  };
  const note = values.note.trim();
  if (note) payload.note = note;
  return payload;
}

export function toAttendanceUpdatePayload(values: EditAttendanceValues): AttendanceUpdatePayload {
  return {
    status: values.status,
    note: values.note.trim(),
  };
}
