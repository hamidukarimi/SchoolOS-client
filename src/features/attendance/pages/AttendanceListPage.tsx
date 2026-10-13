import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage } from "../../../services/api-error";
import { classListKey, fetchClasses } from "../../classes/api";
import { fetchStudents, studentListKey } from "../../students/api";
import {
  attendanceListKey,
  attendanceSummaryKey,
  fetchAttendance,
  fetchAttendanceSummary,
} from "../api";
import {
  attendanceListIntroduction,
  attendanceStatusLabel,
  canManageAttendance,
  formatAttendanceDate,
  readNotice,
} from "../display";
import { parseAttendanceListQuery } from "../query";
import { ATTENDANCE_STATUSES, type AttendanceListQuery, type AttendanceStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<AttendanceListQuery>,
) {
  const query = { ...parseAttendanceListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.studentId) params.set("studentId", query.studentId);
  if (query.classId) params.set("classId", query.classId);
  if (query.status) params.set("status", query.status);
  if (query.date) params.set("date", query.date);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function AttendanceListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseAttendanceListQuery(searchParams);
  const query = persona === "student" ? { ...requested, studentId: "" } : requested;
  const [dateDraft, setDateDraft] = useState(query.date);
  const [classSearch, setClassSearch] = useState("");
  const [classQueryText, setClassQueryText] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentQueryText, setStudentQueryText] = useState("");
  const attendanceQuery = useQuery({
    queryKey: attendanceListKey(query),
    queryFn: () => fetchAttendance(query),
  });
  const summaryId = persona === "student" ? access.context?.studentProfileId : undefined;
  const summaryQuery = useQuery({
    queryKey: attendanceSummaryKey(summaryId ?? ""),
    queryFn: () => fetchAttendanceSummary(summaryId ?? ""),
    enabled: Boolean(summaryId),
  });
  const classesQuery = useQuery({
    queryKey: classListKey({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    queryFn: () => fetchClasses({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    enabled: classQueryText.length > 0,
  });
  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: studentQueryText, status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: studentQueryText, status: "", page: 1 }),
    enabled: persona !== "student" && studentQueryText.length > 0,
  });

  useEffect(() => {
    setDateDraft(query.date);
  }, [query.date]);

  const filtered = Boolean(query.date || query.status || query.classId || query.studentId);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Attendance</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{attendanceListIntroduction(persona)}</p>
        </div>
        {canManageAttendance(persona) ? (
          <Link to="/app/attendance/record" className={buttonClass("primary")}>
            Record attendance
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {summaryQuery.data ? (
        <AttendanceSummaryPanel
          present={summaryQuery.data.present}
          absent={summaryQuery.data.absent}
          late={summaryQuery.data.late}
          excused={summaryQuery.data.excused}
          total={summaryQuery.data.total}
          attendanceRate={summaryQuery.data.attendanceRate}
        />
      ) : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, { date: dateDraft, page: 1 });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Date"
            type="date"
            name="date"
            value={dateDraft}
            onChange={(event) => setDateDraft(event.target.value)}
            hint="Matches that calendar date."
          />
          <SelectField
            label="Status"
            name="status"
            value={query.status}
            onChange={(event) => {
              replaceQuery(searchParams, setSearchParams, {
                status: event.target.value as AttendanceStatus | "",
                page: 1,
              });
            }}
          >
            <option value="">All statuses</option>
            {ATTENDANCE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {attendanceStatusLabel(status)}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find a class"
              name="classSearch"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              hint="Filters by a class you are allowed to see."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setClassQueryText(classSearch.trim())}>
            Find class
          </Button>
          {query.classId ? (
            <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { classId: "", page: 1 })}>
              Clear class
            </Button>
          ) : null}
        </div>
        {classesQuery.data ? (
          <SelectField
            label="Class"
            name="classId"
            value={query.classId}
            onChange={(event) => replaceQuery(searchParams, setSearchParams, { classId: event.target.value, page: 1 })}
          >
            <option value="">All classes</option>
            {classesQuery.data.classes.map((classRecord) => (
              <option key={classRecord.id} value={classRecord.id}>
                {classRecord.name}, section {classRecord.section}
              </option>
            ))}
          </SelectField>
        ) : null}
        {persona !== "student" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-60 flex-1">
                <TextField
                  label="Find a student"
                  name="studentSearch"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  hint="Filters by a student you are allowed to see."
                />
              </div>
              <Button type="button" variant="secondary" onClick={() => setStudentQueryText(studentSearch.trim())}>
                Find student
              </Button>
              {query.studentId ? (
                <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { studentId: "", page: 1 })}>
                  Clear student
                </Button>
              ) : null}
            </div>
            {studentsQuery.data ? (
              <SelectField
                label="Student"
                name="studentId"
                value={query.studentId}
                onChange={(event) => replaceQuery(searchParams, setSearchParams, { studentId: event.target.value, page: 1 })}
              >
                <option value="">All students</option>
                {studentsQuery.data.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} · {student.studentId}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
        ) : null}
        <Button type="submit" className="w-fit">
          Apply date
        </Button>
      </form>
      {attendanceQuery.isLoading ? <Spinner label="Loading attendance" /> : null}
      {attendanceQuery.error ? <ServerErrorAlert error={getApiErrorMessage(attendanceQuery.error)} /> : null}
      {attendanceQuery.data && attendanceQuery.data.attendance.length === 0 ? (
        <Alert tone="info" title={filtered ? "No attendance matches these filters" : "No attendance to show"}>
          {filtered ? "Try another date, status, class, or student." : "No attendance records are available in this view."}
        </Alert>
      ) : null}
      {attendanceQuery.data && attendanceQuery.data.attendance.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {attendanceQuery.data.total} {attendanceQuery.data.total === 1 ? "record" : "records"}
            {attendanceQuery.data.totalPages > 1
              ? `, page ${attendanceQuery.data.page} of ${attendanceQuery.data.totalPages}`
              : ""}
          </p>
          <ul className="grid gap-3">
            {attendanceQuery.data.attendance.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/app/attendance/${item.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
                >
                  <span className="font-medium text-ink">
                    {item.student ? `${item.student.firstName} ${item.student.lastName}` : "Student name not returned"}
                  </span>
                  <span className="text-sm text-slate-600">
                    {formatAttendanceDate(item.date)} · {attendanceStatusLabel(item.status)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {item.classRef ? `${item.classRef.name}, section ${item.classRef.section}` : "Class name not returned"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {attendanceQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={attendanceQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: attendanceQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={attendanceQuery.data.page >= attendanceQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: attendanceQuery.data.page + 1 })}
              >
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function AttendanceSummaryPanel(summary: {
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attendanceRate: number;
}) {
  const items = [
    ["Present", summary.present],
    ["Absent", summary.absent],
    ["Late", summary.late],
    ["Excused", summary.excused],
    ["Total", summary.total],
  ] as const;
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">Summary</h2>
      <p className="mt-1 text-sm text-slate-600">
        The server counts present and late toward the rate: {summary.attendanceRate}%.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
