import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchStudents, studentListKey } from "../../students/api";
import { borrowListKey, fetchBorrows, libraryInvalidationKey, returnBook } from "../api";
import { borrowStatusLabel, borrowerLabel, canManageLibrary, formatLibraryDate } from "../display";
import { borrowListQueryForPersona, parseBorrowListQuery } from "../query";
import { BORROW_STATUSES, type BorrowListQuery, type BorrowStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<BorrowListQuery>,
) {
  const query = { ...parseBorrowListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.borrowerId) params.set("borrowerId", query.borrowerId);
  if (query.bookId) params.set("bookId", query.bookId);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function BorrowListPage() {
  const access = useAccess();
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = parseBorrowListQuery(searchParams);
  const query = borrowListQueryForPersona(requested, persona);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentQueryText, setStudentQueryText] = useState("");
  const borrowsQuery = useQuery({
    queryKey: borrowListKey(query),
    queryFn: () => fetchBorrows(query),
  });
  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: studentQueryText, status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: studentQueryText, status: "", page: 1 }),
    enabled: persona !== "student" && studentQueryText.length > 0,
  });

  useEffect(() => {
    setStudentSearch("");
  }, [query.borrowerId]);

  const filtered = Boolean(query.status || query.bookId || query.borrowerId);
  const canManage = canManageLibrary(persona);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Loans</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">
            {persona === "student"
              ? "These are your loans."
              : persona === "teacher"
                ? "These are your loans and loans for students on your class lists."
                : "These are the recorded loans. Returning a book is limited to administrators."}
          </p>
        </div>
        <Link to="/app/library" className={buttonClass("secondary")}>
          Catalog
        </Link>
      </div>
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4"
        onSubmit={(event) => event.preventDefault()}
      >
        <SelectField
          label="Status"
          name="status"
          value={query.status}
          onChange={(event) => replaceQuery(searchParams, setSearchParams, { status: event.target.value as BorrowStatus | "", page: 1 })}
        >
          <option value="">All statuses</option>
          {BORROW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {borrowStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        {query.bookId ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span>Showing loans for one book.</span>
            <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { bookId: "", page: 1 })}>
              Clear book
            </Button>
          </div>
        ) : null}
        {persona === "teacher" && access.context?.teacherProfileId ? (
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              replaceQuery(searchParams, setSearchParams, {
                borrowerId: query.borrowerId === access.context?.teacherProfileId ? "" : access.context?.teacherProfileId ?? "",
                page: 1,
              })
            }
          >
            {query.borrowerId === access.context.teacherProfileId ? "Show class loans too" : "Show my loans"}
          </Button>
        ) : null}
        {persona !== "student" ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-60 flex-1">
                <TextField label="Find a student" name="studentSearch" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} />
              </div>
              <Button type="button" variant="secondary" onClick={() => setStudentQueryText(studentSearch.trim())}>
                Find student
              </Button>
              {query.borrowerId ? (
                <Button type="button" variant="ghost" onClick={() => replaceQuery(searchParams, setSearchParams, { borrowerId: "", page: 1 })}>
                  Clear borrower
                </Button>
              ) : null}
            </div>
            {studentsQuery.data && studentsQuery.data.students.length > 0 ? (
              <SelectField
                label="Student"
                name="borrowerId"
                value={query.borrowerId}
                onChange={(event) => replaceQuery(searchParams, setSearchParams, { borrowerId: event.target.value, page: 1 })}
              >
                <option value="">All borrowers in this view</option>
                {studentsQuery.data.students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} · {student.studentId}
                  </option>
                ))}
              </SelectField>
            ) : null}
          </div>
        ) : null}
      </form>
      {borrowsQuery.isLoading ? <Spinner label="Loading loans" /> : null}
      {borrowsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(borrowsQuery.error)} /> : null}
      {borrowsQuery.data && borrowsQuery.data.borrows.length === 0 ? (
        <Alert tone="info">
          <p className="font-medium">{filtered ? "No loans match these filters" : "No loans to show"}</p>
        </Alert>
      ) : null}
      {borrowsQuery.data && borrowsQuery.data.borrows.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {borrowsQuery.data.total} {borrowsQuery.data.total === 1 ? "loan" : "loans"}
            {borrowsQuery.data.totalPages > 1 ? `, page ${borrowsQuery.data.page} of ${borrowsQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
          {borrowsQuery.data.borrows.map((borrow) => (
            <li key={borrow.id} className="grid gap-2 rounded-xl border border-line bg-white px-4 py-4">
              <div>
                {borrow.book ? (
                  <Link to={`/app/library/books/${borrow.book.id}`} className="font-medium text-ink hover:text-pine">
                    {borrow.book.title}
                  </Link>
                ) : (
                  <p className="font-medium text-ink">Book details were not returned</p>
                )}
                <p className="mt-1 text-sm text-slate-600">
                  {borrowerLabel(borrow.borrower, borrow.borrowerType)} · {borrowStatusLabel(borrow.status)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Due {formatLibraryDate(borrow.dueDate)}
                  {borrow.returnDate ? ` · Returned ${formatLibraryDate(borrow.returnDate)}` : ""}
                </p>
              </div>
              {canManage && borrow.status !== "returned" ? <ReturnLoan borrowId={borrow.id} /> : null}
            </li>
          ))}
          </ul>
          {borrowsQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={borrowsQuery.data.page <= 1} onClick={() => replaceQuery(searchParams, setSearchParams, { page: borrowsQuery.data.page - 1 })}>
                Previous page
              </Button>
              <Button type="button" variant="secondary" disabled={borrowsQuery.data.page >= borrowsQuery.data.totalPages} onClick={() => replaceQuery(searchParams, setSearchParams, { page: borrowsQuery.data.page + 1 })}>
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function ReturnLoan({ borrowId }: { borrowId: string }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const mutation = useMutation({
    mutationFn: () => returnBook(borrowId, {}),
    onSuccess: async () => {
      setServerError(null);
      await queryClient.invalidateQueries({ queryKey: libraryInvalidationKey });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      {confirming ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" busy={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Saving" : "Confirm return"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setConfirming(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" onClick={() => setConfirming(true)}>
          Return book
        </Button>
      )}
    </div>
  );
}
