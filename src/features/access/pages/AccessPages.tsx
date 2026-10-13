import { Link } from "react-router";
import { Alert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { Dashboard } from "../../dashboard/Dashboard";
import { useAccess } from "../access-context";
import { homePathFor, personaLabel } from "../navigation";

export function AdminHomePage() {
  return (
    <section className="mx-auto grid max-w-5xl gap-2">
      <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
      <h1 className="mt-2 font-serif text-4xl">School administration</h1>
      <p className="mt-4 leading-7 text-slate-700">
        This account is an administrator because its role is admin. Student records can be opened
        from Students, teacher records from Teachers, staff records from Staff, classes from Classes, class lists from
        Enrollment, attendance from Attendance, results from Results, exams from Exams, the schedule from Timetable, fees from Fees, the catalog from Library, reports from Reports, and private conversations from Messages.
        The counts below are the totals those lists return for this account.
      </p>
      <div className="mt-8">
        <Dashboard persona="admin" />
      </div>
    </section>
  );
}

export function TeacherHomePage() {
  return (
    <section className="mx-auto grid max-w-5xl gap-2">
      <p className="text-sm font-medium tracking-wide text-pine uppercase">Teacher</p>
      <h1 className="mt-2 font-serif text-4xl">Teacher access</h1>
      <p className="mt-4 leading-7 text-slate-700">
        This account role is user. A teacher profile linked to the account gives teacher access.
        Students enrolled in your classes can be opened from Students. Your own teaching profile
        is under Teaching record, the classes you teach are under Classes, attendance you can
        read is under Attendance, results you can read are under Results, exams you can read are under Exams, lessons you can read are under Timetable, fees you can read are under Fees, the catalog is under Library, reports are under Reports, and private conversations are under Messages.
      </p>
      <div className="mt-8">
        <Dashboard persona="teacher" />
      </div>
    </section>
  );
}

export function StudentHomePage() {
  return (
    <section className="mx-auto grid max-w-5xl gap-2">
      <p className="text-sm font-medium tracking-wide text-pine uppercase">Student</p>
      <h1 className="mt-2 font-serif text-4xl">Student access</h1>
      <p className="mt-4 leading-7 text-slate-700">
        This account role is user. A student profile linked to the account gives student access.
        Your own student profile can be opened from My record, your class teachers from Teachers,
        your classes from Classes, your attendance from Attendance, your results from Results, exams for your classes from Exams, your class schedule from Timetable, your fees from Fees, the catalog from Library, reports from Reports, and private conversations from Messages.
      </p>
      <div className="mt-8">
        <Dashboard persona="student" />
      </div>
    </section>
  );
}

export function PendingAccessPage() {
  return (
    <section className="max-w-2xl">
      <p className="text-sm font-medium tracking-wide text-pine uppercase">No school profile</p>
      <h1 className="mt-2 font-serif text-4xl">School access is not assigned</h1>
      <p className="mt-4 leading-7 text-slate-700">
        You are signed in as a standard user. No teacher or student profile is linked to this
        account, so school records are not available. An administrator needs to link a profile
        before that access exists. A staff record by itself does not grant it.
      </p>
      <p className="mt-4 leading-7 text-slate-700">
        You can update your profile and password from this account. Messages shows conversations sent to you. You can reply there, and you cannot start a new conversation until a teacher or student profile is linked, or you use an administrator account.
      </p>
    </section>
  );
}

export function UnauthorizedPage() {
  const { context } = useAccess();
  const home = context ? homePathFor(context.persona) : "/app/profile";

  return (
    <section className="max-w-2xl">
      <h1 className="font-serif text-4xl">This page is unavailable</h1>
      <p className="mt-4 leading-7 text-slate-700">
        {context
          ? `Your current access is ${personaLabel(context.persona)}. This page belongs to a different school access level.`
          : "Your school access does not include this page."}
      </p>
      <Link to={home} className={`${buttonClass("primary")} mt-6`}>
        Go to your home
      </Link>
    </section>
  );
}

export function AccessErrorState() {
  const { errorMessage, retry } = useAccess();

  return (
    <section className="max-w-2xl">
      <h1 className="font-serif text-4xl">School access could not be checked</h1>
      <div className="mt-4">
        <Alert tone="error">{errorMessage ?? "School access could not be verified."}</Alert>
      </div>
      <p className="mt-4 leading-7 text-slate-700">
        Profile and password remain available. School pages stay closed until this check succeeds.
      </p>
      <Button type="button" className="mt-6" onClick={retry}>
        Try again
      </Button>
    </section>
  );
}
