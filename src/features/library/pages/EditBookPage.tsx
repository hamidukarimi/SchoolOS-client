import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useParams } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { bookDetailKey, fetchBook, libraryInvalidationKey, updateBook } from "../api";
import { bookFormSchema, toBookPayload, type BookFormValues } from "../schemas";
import { BookFields } from "./BookForm";

export function EditBookPage() {
  const { id = "" } = useParams();
  const bookQuery = useQuery({
    queryKey: bookDetailKey(id),
    queryFn: () => fetchBook(id),
    enabled: Boolean(id),
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
  return (
    <EditBookForm
      id={book.id}
      defaults={{
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        category: book.category,
        totalCopies: book.totalCopies,
        availableCopies: book.availableCopies,
        description: book.description,
        publishedYear: book.publishedYear === null ? "" : String(book.publishedYear),
        status: book.status,
      }}
    />
  );
}

function EditBookForm({ id, defaults }: { id: string; defaults: BookFormValues }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<BookFormValues>({ resolver: zodResolver(bookFormSchema), defaultValues: defaults });
  const mutation = useMutation({
    mutationFn: (values: BookFormValues) => updateBook(id, toBookPayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: libraryInvalidationKey });
      navigate(`/app/library/books/${id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Edit book</h1>
        <p className="mt-3 leading-7 text-slate-700">{defaults.title}</p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <BookFields form={form} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Save book"}
          </Button>
          <Link to={`/app/library/books/${id}`} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
