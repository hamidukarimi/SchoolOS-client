import type { UseFormReturn } from "react-hook-form";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { bookStatusLabel } from "../display";
import type { BookFormValues } from "../schemas";
import { BOOK_STATUSES } from "../types";

export function BookFields({ form }: { form: UseFormReturn<BookFormValues> }) {
  const { errors } = form.formState;
  return (
    <>
      <TextField label="Title" error={errors.title?.message} {...form.register("title")} />
      <TextField label="Author" error={errors.author?.message} {...form.register("author")} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="ISBN" error={errors.isbn?.message} {...form.register("isbn")} />
        <TextField label="Category" error={errors.category?.message} {...form.register("category")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Total copies"
          type="number"
          min={1}
          step={1}
          error={errors.totalCopies?.message}
          {...form.register("totalCopies", { valueAsNumber: true })}
        />
        <TextField
          label="Available copies"
          type="number"
          min={0}
          step={1}
          error={errors.availableCopies?.message}
          {...form.register("availableCopies", { valueAsNumber: true })}
        />
      </div>
      <TextField label="Description" error={errors.description?.message} {...form.register("description")} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Published year" error={errors.publishedYear?.message} {...form.register("publishedYear")} />
        <SelectField label="Status" error={errors.status?.message} {...form.register("status")}>
          {BOOK_STATUSES.map((status) => (
            <option key={status} value={status}>
              {bookStatusLabel(status)}
            </option>
          ))}
        </SelectField>
      </div>
    </>
  );
}
