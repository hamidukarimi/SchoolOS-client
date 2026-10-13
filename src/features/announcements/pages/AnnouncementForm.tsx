import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import type { ParsedApiError } from "../../../services/api-error";
import { classListKey, fetchClasses } from "../../classes/api";
import { audienceLabel } from "../display";
import { announcementFormSchema, type AnnouncementFormValues } from "../schemas";
import { ANNOUNCEMENT_AUDIENCES, type AnnouncementClassRef } from "../types";

export function AnnouncementForm({
  heading,
  description,
  initialValues,
  savedClass,
  cancelTo,
  submitLabel,
  pendingLabel,
  busy,
  serverError,
  onSubmit,
}: {
  heading: string;
  description: string;
  initialValues: AnnouncementFormValues;
  savedClass: AnnouncementClassRef | null;
  cancelTo: string;
  submitLabel: string;
  pendingLabel: string;
  busy: boolean;
  serverError: ParsedApiError | null;
  onSubmit: (values: AnnouncementFormValues) => void;
}) {
  const [classSearch, setClassSearch] = useState("");
  const [classQueryText, setClassQueryText] = useState("");
  const classesQuery = useQuery({
    queryKey: classListKey({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    queryFn: () => fetchClasses({ search: classQueryText, status: "", grade: "", academicYear: "", page: 1 }),
    enabled: classQueryText.length > 0,
  });
  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: initialValues,
  });
  const { errors } = form.formState;

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="font-serif text-4xl">{heading}</h1>
        <p className="mt-3 leading-7 text-slate-700">{description}</p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4 rounded-xl border border-line bg-white p-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <TextField label="Title" error={errors.title?.message} {...form.register("title")} />
        <div className="grid gap-1.5">
          <label htmlFor="content" className="text-sm font-medium text-ink">
            Content
          </label>
          <textarea
            id="content"
            rows={6}
            aria-invalid={errors.content ? true : undefined}
            aria-describedby={errors.content ? "content-error" : undefined}
            className={`rounded-lg border bg-white px-3 py-2.5 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-pine ${
              errors.content ? "border-rose-600" : "border-line"
            }`}
            {...form.register("content")}
          />
          {errors.content ? (
            <p id="content-error" className="text-sm text-rose-700">
              {errors.content.message}
            </p>
          ) : null}
        </div>
        <SelectField label="Audience" error={errors.audience?.message} {...form.register("audience")}>
          {ANNOUNCEMENT_AUDIENCES.map((audience) => (
            <option key={audience} value={audience}>
              {audienceLabel(audience)}
            </option>
          ))}
        </SelectField>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-60 flex-1">
            <TextField
              label="Limit to a class"
              name="classSearch"
              value={classSearch}
              onChange={(event) => setClassSearch(event.target.value)}
              hint="Leave the class empty for a school-wide announcement."
            />
          </div>
          <Button type="button" variant="secondary" onClick={() => setClassQueryText(classSearch.trim())}>
            Find class
          </Button>
          <Button type="button" variant="ghost" onClick={() => form.setValue("classId", "")}>
            Clear class
          </Button>
        </div>
        {savedClass && form.watch("classId") === savedClass.id ? (
          <p className="text-sm text-slate-600">
            Current class: {savedClass.name}, section {savedClass.section}
          </p>
        ) : null}
        {classesQuery.data ? (
          <SelectField label="Class" error={errors.classId?.message} {...form.register("classId")}>
            <option value="">School-wide</option>
            {classesQuery.data.classes.map((classRecord) => (
              <option key={classRecord.id} value={classRecord.id}>
                {classRecord.name}, section {classRecord.section}
              </option>
            ))}
          </SelectField>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Publish date" type="date" error={errors.publishDate?.message} {...form.register("publishDate")} />
          <TextField label="Expiry date" type="date" error={errors.expiryDate?.message} {...form.register("expiryDate")} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-pine" {...form.register("isPublished")} />
          Published
        </label>
        {classesQuery.error ? <Alert tone="error">The class search could not be loaded.</Alert> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={busy}>
            {busy ? pendingLabel : submitLabel}
          </Button>
          <Link to={cancelTo} className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
