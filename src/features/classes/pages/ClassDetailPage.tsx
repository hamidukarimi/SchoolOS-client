import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { classDetailKey, deleteClass, fetchClass } from "../api";
import { canManageClasses, classStatusLabel, classTeacherLabel, readNotice } from "../display";
import type { ClassRecord } from "../types";

export function ClassDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const access = useAccess();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const classQuery = useQuery({
    queryKey: classDetailKey(id),
    queryFn: () => fetchClass(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteClass(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      navigate("/app/classes", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (classQuery.isLoading) return <FullPageSpinner label="Loading class" />;

  if (classQuery.error || !classQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert
          error={
            classQuery.error
              ? getApiErrorMessage(classQuery.error)
              : { message: "This class could not be loaded.", errors: [] }
          }
        />
        <Link to="/app/classes" className={buttonClass("secondary")}>
          Back to classes
        </Link>
      </section>
    );
  }

  const classRecord = classQuery.data;
  const persona = access.context?.persona;
  const canManage = canManageClasses(persona);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Class</p>
          <h1 className="mt-2 font-serif text-4xl">
            {classRecord.name}, section {classRecord.section}
          </h1>
          <p className="mt-2 text-slate-600">
            Grade {classRecord.grade} · {classRecord.academicYear} · {classStatusLabel(classRecord.status)}
          </p>
        </div>
        {canManage ? (
          <Link to={`/app/classes/${classRecord.id}/edit`} className={buttonClass("primary")}>
            Edit class
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-slate-600">Grade</dt>
          <dd className="mt-1 text-sm font-medium">{classRecord.grade}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Academic year</dt>
          <dd className="mt-1 text-sm font-medium">{classRecord.academicYear}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Capacity</dt>
          <dd className="mt-1 text-sm font-medium">{classRecord.capacity}</dd>
        </div>
        <div>
          <dt className="text-sm text-slate-600">Enrolled students</dt>
          <dd className="mt-1 text-sm font-medium">{classRecord.studentCount}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-slate-600">Teacher</dt>
          <dd className="mt-1 text-sm font-medium">
            <TeacherReference classRecord={classRecord} persona={persona} teacherProfileId={access.context?.teacherProfileId} />
          </dd>
        </div>
      </dl>
      <ClassRoster
        classRecord={classRecord}
        persona={persona}
        studentProfileId={access.context?.studentProfileId}
      />
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium text-ink">Delete class</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            This removes the class. It does not delete teacher or student profiles, and it does not
            clear the class field stored on a student profile.
          </p>
          {confirmingDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="danger"
                busy={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting" : "Confirm delete"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              Delete class
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/classes" className={buttonClass("secondary")}>
        Back to classes
      </Link>
    </section>
  );
}

function TeacherReference({
  classRecord,
  persona,
  teacherProfileId,
}: {
  classRecord: ClassRecord;
  persona: string | undefined;
  teacherProfileId?: string;
}) {
  const teacher = classRecord.teacher;
  if (!teacher) return classTeacherLabel(null);
  const canOpen =
    persona === "admin" || persona === "student" || (persona === "teacher" && teacher.id === teacherProfileId);
  if (!canOpen) return classTeacherLabel(teacher);
  return (
    <Link to={`/app/teachers/${teacher.id}`} className="underline decoration-line underline-offset-4">
      {classTeacherLabel(teacher)}
    </Link>
  );
}

function ClassRoster({
  classRecord,
  persona,
  studentProfileId,
}: {
  classRecord: ClassRecord;
  persona: string | undefined;
  studentProfileId?: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-white p-4">
      <h2 className="text-base font-medium">Students in this class</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        This list comes from the class record.
        {persona === "admin" ? (
          <>
            {" "}
            Add or remove students from{" "}
            <Link to={`/app/enrollments/${classRecord.id}`} className="underline decoration-line underline-offset-4">
              Enrollment
            </Link>
            .
          </>
        ) : (
          " Changing this list is limited to administrators."
        )}
      </p>
      {classRecord.studentCount === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No students are listed on this class.</p>
      ) : null}
      {classRecord.studentCount > 0 && classRecord.students.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">
          {classRecord.studentCount} {classRecord.studentCount === 1 ? "student is" : "students are"} listed, without names in this response.
        </p>
      ) : null}
      {classRecord.students.length > 0 ? (
        <ul className="mt-4 grid gap-2">
          {classRecord.students.map((student) => {
            const label = `${student.firstName} ${student.lastName}${student.studentId ? ` · ${student.studentId}` : ""}`;
            const canOpen = persona === "admin" || persona === "teacher" || student.id === studentProfileId;
            return (
              <li key={student.id} className="text-sm">
                {canOpen ? (
                  <Link to={`/app/students/${student.id}`} className="underline decoration-line underline-offset-4">
                    {label}
                  </Link>
                ) : (
                  label
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
