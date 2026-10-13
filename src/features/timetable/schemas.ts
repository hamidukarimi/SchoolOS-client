import { z } from "zod";
import { TIMETABLE_DAYS, TIMETABLE_STATUSES, type TimetableWritePayload } from "./types";

export const timetableFormSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  teacherId: z.string().min(1, "Teacher ID is required"),
  subject: z.string().min(1, "Subject is required"),
  dayOfWeek: z.enum(TIMETABLE_DAYS, { message: "Invalid day of week" }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  room: z.string(),
  academicYear: z.string().min(1, "Academic year is required"),
  status: z.enum(TIMETABLE_STATUSES, { message: "Status must be active or inactive" }),
});

export type TimetableFormValues = z.infer<typeof timetableFormSchema>;

export function toTimetableCreatePayload(values: TimetableFormValues): TimetableWritePayload {
  const payload: TimetableWritePayload = {
    classId: values.classId,
    teacherId: values.teacherId,
    subject: values.subject.trim(),
    dayOfWeek: values.dayOfWeek,
    startTime: values.startTime.trim(),
    endTime: values.endTime.trim(),
    academicYear: values.academicYear.trim(),
    status: values.status,
  };
  const room = values.room.trim();
  if (room) payload.room = room;
  return payload;
}

export function toTimetableUpdatePayload(values: TimetableFormValues): TimetableWritePayload {
  return {
    ...toTimetableCreatePayload(values),
    room: values.room.trim(),
  };
}
