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
import { bookListKey, fetchBooks } from "../api";
import { bookListIntroduction, bookStatusLabel, canManageLibrary, readNotice } from "../display";
import { parseBookListQuery } from "../query";
import { BOOK_STATUSES, type BookListQuery, type BookStatus } from "../types";

function replaceQuery(
  current: URLSearchParams,
  setSearchParams: (next: URLSearchParams) => void,
  next: Partial<BookListQuery>,
) {
  const query = { ...parseBookListQuery(current), ...next };
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  if (query.status) params.set("status", query.status);
  if (query.page > 1) params.set("page", String(query.page));
  setSearchParams(params);
}

export function BookListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const query = parseBookListQuery(searchParams);
  const [searchDraft, setSearchDraft] = useState(query.search);
  const [categoryDraft, setCategoryDraft] = useState(query.category);
  const booksQuery = useQuery({
    queryKey: bookListKey(query),
    queryFn: () => fetchBooks(query),
  });

  useEffect(() => {
    setSearchDraft(query.search);
    setCategoryDraft(query.category);
  }, [query.search, query.category]);

  const filtered = Boolean(query.search || query.category || query.status);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Library</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{bookListIntroduction(persona)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/library/borrows" className={buttonClass("secondary")}>
            Loans
          </Link>
          {canManageLibrary(persona) ? (
            <Link to="/app/library/books/new" className={buttonClass("primary")}>
              Add book
            </Link>
          ) : null}
        </div>
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      <form
        className="grid gap-4 rounded-xl border border-line bg-white p-4 md:grid-cols-[1fr_1fr_14rem_auto] md:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          replaceQuery(searchParams, setSearchParams, {
            search: searchDraft.trim(),
            category: categoryDraft.trim(),
            page: 1,
          });
        }}
      >
        <TextField label="Search" name="search" value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} hint="Matches title, author, or ISBN." />
        <TextField label="Category" name="category" value={categoryDraft} onChange={(event) => setCategoryDraft(event.target.value)} />
        <SelectField
          label="Status"
          name="status"
          value={query.status}
          onChange={(event) => replaceQuery(searchParams, setSearchParams, { status: event.target.value as BookStatus | "", page: 1 })}
        >
          <option value="">All statuses</option>
          {BOOK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {bookStatusLabel(status)}
            </option>
          ))}
        </SelectField>
        <Button type="submit" variant="secondary">
          Apply
        </Button>
      </form>
      {booksQuery.isLoading ? <Spinner label="Loading books" /> : null}
      {booksQuery.error ? <ServerErrorAlert error={getApiErrorMessage(booksQuery.error)} /> : null}
      {booksQuery.data && booksQuery.data.books.length === 0 ? (
        <Alert tone="info">
          <p className="font-medium">{filtered ? "No books match these filters" : "No books to show"}</p>
          <p className="mt-2 text-sm">{filtered ? "Try another title, author, category, or status." : "There are no books in the catalog."}</p>
        </Alert>
      ) : null}
      {booksQuery.data && booksQuery.data.books.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {booksQuery.data.total} {booksQuery.data.total === 1 ? "book" : "books"}
            {booksQuery.data.totalPages > 1 ? `, page ${booksQuery.data.page} of ${booksQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {booksQuery.data.books.map((book) => (
              <li key={book.id}>
                <Link
                  to={`/app/library/books/${book.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 hover:border-pine focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
                >
                  <span className="font-medium text-ink">{book.title}</span>
                  <span className="text-sm text-slate-600">
                    {book.author} · {book.category} · {bookStatusLabel(book.status)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {book.availableCopies} of {book.totalCopies} available
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {booksQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" disabled={booksQuery.data.page <= 1} onClick={() => replaceQuery(searchParams, setSearchParams, { page: booksQuery.data.page - 1 })}>
                Previous page
              </Button>
              <Button type="button" variant="secondary" disabled={booksQuery.data.page >= booksQuery.data.totalPages} onClick={() => replaceQuery(searchParams, setSearchParams, { page: booksQuery.data.page + 1 })}>
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
