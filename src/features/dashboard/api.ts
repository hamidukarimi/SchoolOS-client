import type { ApiSuccess } from "../auth/types";
import { http } from "../../services/http";
import { fetchAttendance } from "../attendance/api";
import type { AttendanceStatus } from "../attendance/types";
import { readListTotal } from "./model";

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export interface AttendanceDayCounts {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
}

export function dashboardTotalKey(collection: "students" | "teachers" | "classes") {
  return ["dashboard", "total", collection] as const;
}

export function dashboardAttendanceKey(date: string) {
  return ["dashboard", "attendance", date] as const;
}

function requireData<T>(data: T | undefined, action: string): T {
  if (data === undefined || data === null) {
    throw new Error(`${action} response did not include data.`);
  }
  return data;
}

export async function fetchDashboardTotal(collection: "students" | "teachers" | "classes"): Promise<number> {
  const response = await http.get<ApiSuccess<unknown>>(`/${collection}`, { params: { page: 1, limit: 1 } });
  return readListTotal(requireData(response.data.data, "Dashboard"), collection);
}

export async function fetchAttendanceDayCounts(date: string): Promise<AttendanceDayCounts> {
  const totals = await Promise.all(
    ATTENDANCE_STATUSES.map(async (status) => {
      const result = await fetchAttendance({ studentId: "", classId: "", status, date, page: 1 }, 1);
      return [status, result.total] as const;
    }),
  );
  const counts = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
  for (const [status, total] of totals) counts[status] = total;
  counts.total = counts.present + counts.absent + counts.late + counts.excused;
  return counts;
}
