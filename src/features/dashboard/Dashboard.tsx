import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ServerErrorAlert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { getApiErrorMessage } from "../../services/api-error";
import type { SchoolPersona } from "../access/types";
import { useAccess } from "../access/access-context";
import { attendanceSummaryKey, fetchAttendanceSummary } from "../attendance/api";
import { AttendanceSummaryPanel } from "../attendance/pages/AttendanceListPage";
import { examListKey, fetchExams } from "../exams/api";
import { examStatusLabel, formatExamDate } from "../exams/display";
import { fetchGradeSummary, gradeSummaryKey } from "../grades/api";
import { GradeSummaryPanel } from "../grades/pages/GradeListPage";
import { fetchTimetables, timetableListKey } from "../timetable/api";
import { timetableDayLabel, timetableStatusLabel } from "../timetable/display";
import { dashboardAttendanceKey, dashboardTotalKey, fetchAttendanceDayCounts, fetchDashboardTotal } from "./api";
import { formatCalendarDate, localCalendarDate, timetableDayForDate } from "./calendar";
import { attendanceShare, dashboardWidgets, totalCardCopy } from "./model";

const SCHEDULED_EXAM_LIMIT = 5;

export function Dashboard({ persona }: { persona: SchoolPersona }) {
  const widgets = dashboardWidgets(persona);
  const today = localCalendarDate(new Date());
  const weekday = timetableDayForDate(new Date());

  return (
    <div className="grid gap-6">
      {widgets.includes("students") || widgets.includes("teachers") || widgets.includes("classes") ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(["students", "teachers", "classes"] as const)
            .filter((collection) => widgets.includes(collection))
            .map((collection) => (
              <TotalCard key={collection} persona={persona} collection={collection} />
            ))}
        </div>
      ) : null}
      {widgets.includes("attendance") ? <AttendanceDay persona={persona} date={today} /> : null}
      {widgets.includes("attendance-summary") ? <OwnAttendance /> : null}
      {widgets.includes("grade-summary") ? <OwnGrades /> : null}
      {widgets.includes("exams") ? <ScheduledExams /> : null}
      {widgets.includes("timetable") ? <TodayLessons date={today} weekday={weekday} /> : null}
    </div>
  );
}

function TotalCard({
  persona,
  collection,
}: {
  persona: SchoolPersona;
  collection: "students" | "teachers" | "classes";
}) {
  const copy = totalCardCopy(persona, collection);
  const query = useQuery({
    queryKey: dashboardTotalKey(collection),
    queryFn: () => fetchDashboardTotal(collection),
  });

  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">{copy.label}</h2>
      <p className="mt-1 text-sm text-slate-600">{copy.hint}</p>
      {query.isLoading ? <p className="mt-3 text-sm text-slate-600">Loading</p> : null}
      {query.error ? <WidgetError error={query.error} onRetry={() => query.refetch()} /> : null}
      {typeof query.data === "number" ? <p className="mt-3 font-serif text-3xl">{query.data}</p> : null}
      <Link to={copy.to} className="mt-3 inline-block text-sm underline decoration-line underline-offset-4">
        Open {copy.label.toLowerCase()}
      </Link>
    </section>
  );
}

function AttendanceDay({ persona, date }: { persona: SchoolPersona; date: string }) {
  const query = useQuery({
    queryKey: dashboardAttendanceKey(date),
    queryFn: () => fetchAttendanceDayCounts(date),
  });
  const share = query.data ? attendanceShare(query.data) : null;
  const heading = persona === "teacher" ? "Attendance you can read" : "Attendance";

  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">
        {heading} · {formatCalendarDate(date)}
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Counts come from one request per status. {share === null ? "No records were returned for this date." : `Present and late are ${share}% of these counts.`}
      </p>
      {query.isLoading ? <p className="mt-3 text-sm text-slate-600">Loading attendance</p> : null}
      {query.error ? <WidgetError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["Present", query.data.present],
              ["Absent", query.data.absent],
              ["Late", query.data.late],
              ["Excused", query.data.excused],
              ["Total", query.data.total],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-slate-600">{label}</dt>
              <dd className="mt-1 text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <Link to={`/app/attendance?date=${date}`} className="mt-3 inline-block text-sm underline decoration-line underline-offset-4">
        Open attendance
      </Link>
    </section>
  );
}

function OwnAttendance() {
  const access = useAccess();
  const studentId = access.context?.studentProfileId ?? "";
  const query = useQuery({
    queryKey: attendanceSummaryKey(studentId),
    queryFn: () => fetchAttendanceSummary(studentId),
    enabled: Boolean(studentId),
  });

  return (
    <section className="grid gap-3">
      <h2 className="font-serif text-2xl">Your attendance</h2>
      {!studentId ? <p className="text-sm text-slate-600">Your student record was not available for this summary.</p> : null}
      {query.isLoading ? <p className="text-sm text-slate-600">Loading attendance</p> : null}
      {query.error ? <WidgetError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? <AttendanceSummaryPanel {...query.data} /> : null}
      <Link to="/app/attendance" className="text-sm underline decoration-line underline-offset-4">
        Open attendance
      </Link>
    </section>
  );
}

function OwnGrades() {
  const access = useAccess();
  const studentId = access.context?.studentProfileId ?? "";
  const query = useQuery({
    queryKey: gradeSummaryKey(studentId),
    queryFn: () => fetchGradeSummary(studentId),
    enabled: Boolean(studentId),
  });

  return (
    <section className="grid gap-3">
      <h2 className="font-serif text-2xl">Your results</h2>
      {!studentId ? <p className="text-sm text-slate-600">Your student record was not available for this summary.</p> : null}
      {query.isLoading ? <p className="text-sm text-slate-600">Loading results</p> : null}
      {query.error ? <WidgetError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? <GradeSummaryPanel {...query.data} /> : null}
      <Link to="/app/grades" className="text-sm underline decoration-line underline-offset-4">
        Open results
      </Link>
    </section>
  );
}

function ScheduledExams() {
  const queryParams = { classId: "", teacherId: "", subject: "", status: "scheduled" as const, academicYear: "", page: 1 };
  const query = useQuery({
    queryKey: examListKey(queryParams),
    queryFn: () => fetchExams(queryParams, SCHEDULED_EXAM_LIMIT),
  });

  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">Scheduled exams</h2>
      <p className="mt-1 text-sm text-slate-600">
        The earliest exams still marked scheduled. A past exam stays here until its status changes.
      </p>
      {query.isLoading ? <p className="mt-3 text-sm text-slate-600">Loading exams</p> : null}
      {query.error ? <WidgetError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data && query.data.exams.length === 0 ? <p className="mt-3 text-sm text-slate-600">No scheduled exams were returned.</p> : null}
      {query.data && query.data.exams.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {query.data.exams.map((exam) => (
            <li key={exam.id} className="text-sm">
              <Link to={`/app/exams/${exam.id}`} className="underline decoration-line underline-offset-4">
                {formatExamDate(exam.date)} · {exam.title} · {exam.subject || "No subject"} · {examStatusLabel(exam.status)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {query.data && query.data.total > query.data.exams.length ? (
        <p className="mt-3 text-sm text-slate-600">More scheduled exams exist than this list shows.</p>
      ) : null}
      <Link to="/app/exams?status=scheduled" className="mt-3 inline-block text-sm underline decoration-line underline-offset-4">
        Open exams
      </Link>
    </section>
  );
}

function TodayLessons({ date, weekday }: { date: string; weekday: ReturnType<typeof timetableDayForDate> }) {
  const queryParams = {
    classId: "",
    teacherId: "",
    dayOfWeek: weekday ?? "monday",
    academicYear: "",
    page: 1,
  };
  const query = useQuery({
    queryKey: timetableListKey(queryParams),
    queryFn: () => fetchTimetables(queryParams),
    enabled: Boolean(weekday),
  });

  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">Lessons · {formatCalendarDate(date)}</h2>
      {!weekday ? <p className="mt-2 text-sm text-slate-600">The timetable has no Saturday or Sunday lessons.</p> : null}
      {weekday ? <p className="mt-1 text-sm text-slate-600">Lessons for {timetableDayLabel(weekday)} that this account can read. Inactive lessons are included.</p> : null}
      {query.isLoading ? <p className="mt-3 text-sm text-slate-600">Loading lessons</p> : null}
      {query.error ? <WidgetError error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data && query.data.timetables.length === 0 ? <p className="mt-3 text-sm text-slate-600">No lessons were returned for this day.</p> : null}
      {query.data && query.data.timetables.length > 0 ? (
        <ul className="mt-3 grid gap-2">
          {query.data.timetables.map((lesson) => (
            <li key={lesson.id} className="text-sm">
              <Link to={`/app/timetables/${lesson.id}`} className="underline decoration-line underline-offset-4">
                {lesson.startTime || "No start"} – {lesson.endTime || "No end"} · {lesson.subject || "No subject"} ·{" "}
                {lesson.classRef ? `${lesson.classRef.name}, section ${lesson.classRef.section}` : "Class name not returned"} ·{" "}
                {timetableStatusLabel(lesson.status)}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {query.data && query.data.totalPages > 1 ? (
        <p className="mt-3 text-sm text-slate-600">More lessons exist for this day than this list shows.</p>
      ) : null}
      {weekday ? (
        <Link to={`/app/timetables?dayOfWeek=${weekday}`} className="mt-3 inline-block text-sm underline decoration-line underline-offset-4">
          Open timetable
        </Link>
      ) : null}
    </section>
  );
}

function WidgetError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="mt-3 grid gap-3">
      <ServerErrorAlert error={getApiErrorMessage(error)} />
      <Button type="button" variant="secondary" className="w-fit" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
