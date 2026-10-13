import type { UseFormReturn } from "react-hook-form";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { feeStatusLabel } from "../display";
import type { FeeFormValues } from "../schemas";
import { FEE_STATUSES } from "../types";

export function FeeFields({
  form,
  includeStudent,
}: {
  form: UseFormReturn<FeeFormValues>;
  includeStudent: boolean;
}) {
  const { errors } = form.formState;
  return (
    <>
      {includeStudent ? <input type="hidden" {...form.register("studentId")} /> : null}
      {includeStudent && errors.studentId ? <p className="text-sm text-rose-700">{errors.studentId.message}</p> : null}
      <TextField label="Title" error={errors.title?.message} {...form.register("title")} />
      <TextField label="Description" error={errors.description?.message} {...form.register("description")} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Amount"
          type="number"
          min={0}
          step="0.01"
          error={errors.amount?.message}
          {...form.register("amount", { valueAsNumber: true })}
        />
        <TextField label="Due date" type="date" error={errors.dueDate?.message} {...form.register("dueDate")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Academic year" error={errors.academicYear?.message} {...form.register("academicYear")} />
        <TextField label="Term" error={errors.term?.message} {...form.register("term")} />
      </div>
      <SelectField label="Status" error={errors.status?.message} {...form.register("status")}>
        {FEE_STATUSES.map((status) => (
          <option key={status} value={status}>
            {feeStatusLabel(status)}
          </option>
        ))}
      </SelectField>
    </>
  );
}
