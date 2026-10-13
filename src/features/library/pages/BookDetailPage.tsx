import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchStudents, studentListKey } from "../../students/api";
import { fetchTeachers, teacherListKey } from "../../teachers/api";
import { bookDetailKey, borrowBook, deleteBook, libraryInvalidationKey, fetchBook } from "../api";
import { bookStatusLabel, canManageLibrary, readNotice } from "../display";
import { borrowFormSchema, toBorrowPayload, type BorrowFormValues } from "../schemas";
import { BORROWER_TYPES } from "../types";

export function BookDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const access = useAccess();
  const queryClient = useQueryClient();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const notice = readNotice(location.state);
  const bookQuery = useQuery({
    queryKey: bookDetailKey(id),
    queryFn: () => fetchBook(id),
    enabled: Boolean(id),
  });
  const deleteMutation = useMutation({
    mutationFn: () => deleteBook(id),
    onSuccess: async (message) => {
      await queryClient.invalidateQueries({ queryKey: libraryInvalidationKey });
      navigate("/app/library", { replace: true, state: { notice: message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  if (bookQuery.isLoading) return <FullPageSpinner label="Loading book" />;
  if (bookQuery.error || !bookQuery.data) {
    return (
      <section className="mx-auto grid max-w-3xl gap-4">
        <ServerErrorAlert error={bookQuery.error ? getApiErrorMessage(bookQuery.error) : { message: "This book could not be loaded.", errors: [] }} />
        <Link to="/app/library" className={buttonClass("secondary")}>
          Back to library
        </Link>
      </section>
    );
  }

  const book = bookQuery.data;
  const canManage = canManageLibrary(access.context?.persona);
  const rows = [
    ["Author", book.author],
    ["Category", book.category],
    ["Status", bookStatusLabel(book.status)],
    ["Available", `${book.availableCopies} of ${book.totalCopies}`],
    ["ISBN", book.isbn || "Not recorded"],
    ["Published year", book.publishedYear === null ? "Not recorded" : String(book.publishedYear)],
    ["Description", book.description || "Not recorded"],
  ];

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium tracking-wide text-pine uppercase">Book</p>
          <h1 className="mt-2 font-serif text-4xl">{book.title}</h1>
        </div>
        {canManage ? (
          <Link to={`/app/library/books/${book.id}/edit`} className={buttonClass("primary")}>
            Edit book
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <dl className="grid gap-4 rounded-xl border border-line bg-white p-4 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      <Link to={`/app/library/borrows?bookId=${book.id}`} className={buttonClass("secondary")}>
        Loans for this book
      </Link>
      {canManage && book.availableCopies > 0 ? <BorrowForm bookId={book.id} /> : null}
      {canManage && book.availableCopies <= 0 ? <p className="text-sm text-slate-700">No copies are available to lend.</p> : null}
      {canManage ? (
        <div className="rounded-xl border border-rose-200 bg-white p-4">
          <h2 className="text-base font-medium text-ink">Delete book</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">A book with an active loan cannot be deleted.</p>
          {confirmingDelete ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="danger" busy={deleteMutation.isPending} onClick={() => deleteMutation.mutate()}>
                {deleteMutation.isPending ? "Deleting" : "Confirm delete"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="danger" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              Delete book
            </Button>
          )}
        </div>
      ) : null}
      <Link to="/app/library" className={buttonClass("secondary")}>
        Back to library
      </Link>
    </section>
  );
}

function BorrowForm({ bookId }: { bookId: string }) {
  const queryClient = useQueryClient();
  const [notice, setNotice] = useState<string | null>(null);
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState("");
  const form = useForm<BorrowFormValues>({
    resolver: zodResolver(borrowFormSchema),
    defaultValues: { borrowerId: "", borrowerType: "student", dueDate: "" },
  });
  const borrowerType = form.watch("borrowerType");
  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: queryText, status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: queryText, status: "", page: 1 }),
    enabled: borrowerType === "student" && queryText.length > 0,
  });
  const teachersQuery = useQuery({
    queryKey: teacherListKey({ search: queryText, status: "", page: 1 }),
    queryFn: () => fetchTeachers({ search: queryText, status: "", page: 1 }),
    enabled: borrowerType === "teacher" && queryText.length > 0,
  });
  const mutation = useMutation({
    mutationFn: (values: BorrowFormValues) => borrowBook(bookId, toBorrowPayload(values)),
    onSuccess: async (message) => {
      setServerError(null);
      setNotice(message);
      form.reset({ borrowerId: "", borrowerType, dueDate: "" });
      await queryClient.invalidateQueries({ queryKey: libraryInvalidationKey });
    },
    onError: (error) => {
      setNotice(null);
      setServerError(getApiErrorMessage(error));
    },
  });
  const choices =
    borrowerType === "student"
      ? (studentsQuery.data?.students ?? []).map((student) => ({
          id: student.id,
          label: `${student.firstName} ${student.lastName} · ${student.studentId}`,
        }))
      : (teachersQuery.data?.teachers ?? []).map((teacher) => ({
          id: teacher.id,
          label: `${teacher.firstName} ${teacher.lastName} · ${teacher.teacherId}`,
        }));

  return (
    <form className="grid gap-4 rounded-xl border border-line bg-white p-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
      <div>
        <h2 className="text-base font-medium text-ink">Record a loan</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">Choose a student or teacher profile. This reduces the available copies by one.</p>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <SelectField
        label="Borrower type"
        error={form.formState.errors.borrowerType?.message}
        {...form.register("borrowerType", {
          onChange: () => form.setValue("borrowerId", ""),
        })}
      >
        {BORROWER_TYPES.map((type) => (
          <option key={type} value={type}>
            {type === "student" ? "Student" : "Teacher"}
          </option>
        ))}
      </SelectField>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-60 flex-1">
          <TextField label="Find a borrower" name="borrowerSearch" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={() => setQueryText(search.trim())}>
          Find
        </Button>
      </div>
      {choices.length > 0 ? (
        <SelectField
          label="Borrower"
          name="borrowerId"
          value={form.watch("borrowerId")}
          onChange={(event) => form.setValue("borrowerId", event.target.value, { shouldValidate: true })}
          error={form.formState.errors.borrowerId?.message}
        >
          <option value="">Choose a borrower</option>
          {choices.map((choice) => (
            <option key={choice.id} value={choice.id}>
              {choice.label}
            </option>
          ))}
        </SelectField>
      ) : null}
      {queryText && choices.length === 0 && !(studentsQuery.isFetching || teachersQuery.isFetching) ? (
        <p className="text-sm text-slate-700">No profiles matched that search.</p>
      ) : null}
      <TextField label="Due date" type="date" error={form.formState.errors.dueDate?.message} {...form.register("dueDate")} />
      <Button type="submit" busy={mutation.isPending}>
        {mutation.isPending ? "Saving" : "Record loan"}
      </Button>
    </form>
  );
}
