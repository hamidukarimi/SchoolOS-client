import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { createBook, libraryInvalidationKey } from "../api";
import { bookFormSchema, toBookPayload, type BookFormValues } from "../schemas";
import { BookFields } from "./BookForm";

const emptyValues: BookFormValues = {
  title: "",
  author: "",
  isbn: "",
  category: "",
  totalCopies: 1,
  availableCopies: 1,
  description: "",
  publishedYear: "",
  status: "available",
};

export function CreateBookPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: emptyValues,
  });
  const mutation = useMutation({
    mutationFn: (values: BookFormValues) => createBook(toBookPayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: libraryInvalidationKey });
      navigate(`/app/library/books/${result.book.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Add book</h1>
        <p className="mt-3 leading-7 text-slate-700">Add a catalog record. Lending a copy is a separate step.</p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <BookFields form={form} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Create book"}
          </Button>
          <Link to="/app/library" className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
