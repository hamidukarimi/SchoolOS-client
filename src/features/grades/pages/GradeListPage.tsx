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
import { examListKey, fetchExams } from "../../exams/api";
import { EXAM_LOOKUP_LIMIT, examChoicesQuery } from "../../exams/query";
import { fetchGradeSummary, fetchGrades, gradeListKey, gradeSummaryKey } from "../api";
import {
  canManageGrades,
  formatStoredGrade,
  gradeListIntroduction,
  readNotice,
} from "../display";
import { gradeListQueryForPersona, parseGradeListQuery } from "../query";
import type { GradeListQuery } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<GradeListQuery>,
) {
  const query = { ...parseGradeListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.studentId) params.set("studentId", query.studentId);
  if (query.examId) params.set("examId", query.examId);
  if (query.classId) params.set("classId", query.classId);
  if (query.subject) params.set("subject", query.subject);
  if (query.academicYear) params.set("academicYear", query.academicYear);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function GradeListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseGradeListQuery(searchParams);
  const query = gradeListQueryForPersona(requested, persona);
  const [subjectDraft, setSubjectDraft] = useState(query.subject);
  const [yearDraft, setYearDraft] = useState(query.academicYear);
  const [classSearch, setClassSearch] = useState("");
  const [classQueryText, setClassQueryText] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentQueryText, setStudentQueryText] = useState("");
  const [examSearch, setExamSearch] = useState("");
  const [examQueryText, setExamQueryText] = useState<string | null>(null);
  const gradesQuery = useQuery({
    queryKey: gradeListKey(query),
    queryFn: () => fetchGrades(query),
  });
  const summaryStudentId = persona === "student" ? access.context?.studentProfileId : query.studentId;
  const summaryQuery = useQuery({
    queryKey: gradeSummaryKey(summaryStudentId ?? "", query.academicYear || undefined),
    queryFn: () => fetchGradeSummary(summaryStudentId ?? "", query.academicYear || undefined),
    enabled: Boolean(summaryStudentId),
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
  const examsQuery = useQuery({
    queryKey: examListKey(examChoicesQuery(examQueryText ?? "")),
    queryFn: () => fetchExams(examChoicesQuery(examQueryText ?? ""), EXAM_LOOKUP_LIMIT),
    enabled: examQueryText !== null,
  });

  useEffect(() => {
    setSubjectDraft(query.subject);
    setYearDraft(query.academicYear);
  }, [query.subject, query.academicYear]);

  const filtered = Boolean(query.subject || query.academicYear || query.classId || query.studentId || query.examId);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Results</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{gradeListIntroduction(persona)}</p>
        </div>
        {canManageGrades(persona) ? (
          <Link to="/app/grades/record" className={buttonClass("primary")}>
            Record a result
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {summaryQuery.data ? (
        <GradeSummaryPanel
          total={summaryQuery.data.total}
          passed={summaryQuery.data.passed}
          failed={summaryQuery.data.failed}
          averageMarks={summaryQuery.data.averageMarks}
          academicYear={query.academicYear}
        />
      ) : null}
      {summaryQuery.error ? <ServerErrorAlert error={getApiErrorMessage(summaryQuery.error)} /> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, { subject: subjectDraft.trim(), academicYear: yearDraft.trim(), page: 1 });
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Subject"
            name="subject"
            value={subjectDraft}
            onChange={(event) => setSubjectDraft(event.target.value)}
            hint="Matches part of the subject stored on the result."
          />
          <TextField
            label="Academic year"
            name="academicYear"
            value={yearDraft}
            onChange={(event) => setYearDraft(event.target.value)}
            hint="Matches the academic year exactly."
          />
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
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Find an exam"
              name="examSearch"
              value={examSearch}
              onChange={(event) => setExamSearch(event.target.value)}
              hint="Narrows exams by subject. Title search is not available."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setExamQueryText(examSearch.trim())}>
            Find exam
          </Button>
          {query.examId ? (
            <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { examId: "", page: 1 })}>
              Clear exam
            </Button>
          ) : null}
        </div>
        {examsQuery.data ? (
          <SelectField
            label="Exam"
            name="examId"
            value={query.examId}
            onChange={(event) => replaceQuery(searchParams, setSearchParams, { examId: event.target.value, page: 1 })}
          >
            <option value="">All exams</option>
            {examsQuery.data.exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} · {exam.subject || "No subject"} · {exam.academicYear || "No year"}
              </option>
            ))}
          </SelectField>
        ) : null}
        {examsQuery.data && examsQuery.data.totalPages > 1 ? (
          <p className="text-sm text-slate-600">More exams exist than this list shows. Narrow the subject to find another exam.</p>
        ) : null}
        <Button type="submit" className="w-fit">
          Apply subject and year
        </Button>
      </form>
      {gradesQuery.isLoading ? <Spinner label="Loading results" /> : null}
      {gradesQuery.error ? <ServerErrorAlert error={getApiErrorMessage(gradesQuery.error)} /> : null}
      {gradesQuery.data && gradesQuery.data.grades.length === 0 ? (
        <Alert tone="info" title={filtered ? "No results match these filters" : "No results to show"}>
          {filtered
            ? "Try another subject, academic year, class, student, or exam."
            : "No results are available in this view."}
        </Alert>
      ) : null}
      {gradesQuery.data && gradesQuery.data.grades.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {gradesQuery.data.total} {gradesQuery.data.total === 1 ? "result" : "results"}
            {gradesQuery.data.totalPages > 1 ? `, page ${gradesQuery.data.page} of ${gradesQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {gradesQuery.data.grades.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/app/grades/${item.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
                >
                  <span className="font-medium text-ink">
                    {item.student ? `${item.student.firstName} ${item.student.lastName}` : "Student name not returned"}
                  </span>
                  <span className="text-sm text-slate-600">
                    {item.exam?.title ?? "Exam name not returned"} · {item.subject || "No subject"} · {formatStoredGrade(item.grade)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {item.marksObtained} / {item.totalMarks}
                    {item.classRef ? ` · ${item.classRef.name}, section ${item.classRef.section}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {gradesQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={gradesQuery.data.page <= 1}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: gradesQuery.data.page - 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={gradesQuery.data.page >= gradesQuery.data.totalPages}
                onClick={() => replaceQuery(searchParams, setSearchParams, { page: gradesQuery.data.page + 1 })}
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

export function GradeSummaryPanel(summary: {
  total: number;
  passed: number;
  failed: number;
  averageMarks: number;
  academicYear?: string;
}) {
  const items = [
    ["Results", summary.total],
    ["Passed", summary.passed],
    ["Failed", summary.failed],
    ["Average", summary.averageMarks],
  ] as const;
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">Summary{summary.academicYear ? ` · ${summary.academicYear}` : ""}</h2>
      <p className="mt-1 text-sm text-slate-600">
        Passed means the stored letter is not F. The average is the mean percentage returned by the server.
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
