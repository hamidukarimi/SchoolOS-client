import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchStudents, studentListKey } from "../../students/api";
import { createFee, feeInvalidationKey } from "../api";
import { feeStudentLabel } from "../display";
import { feeFormSchema, toFeeCreatePayload, type FeeFormValues } from "../schemas";
import { FeeFields } from "./FeeForm";

export function CreateFeePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentQueryText, setStudentQueryText] = useState("");
  const form = useForm<FeeFormValues>({
    resolver: zodResolver(feeFormSchema),
    defaultValues: {
      studentId: "",
      title: "",
      description: "",
      amount: 0,
      dueDate: "",
      academicYear: "",
      term: "",
      status: "pending",
    },
  });
  const studentsQuery = useQuery({
    queryKey: studentListKey({ search: studentQueryText, status: "", page: 1 }),
    queryFn: () => fetchStudents({ search: studentQueryText, status: "", page: 1 }),
    enabled: studentQueryText.length > 0,
  });
  const mutation = useMutation({
    mutationFn: (values: FeeFormValues) => createFee(toFeeCreatePayload(values)),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: feeInvalidationKey });
      navigate(`/app/fees/${result.fee.id}`, { replace: true, state: { notice: result.message } });
    },
    onError: (error) => setServerError(getApiErrorMessage(error)),
  });
  const selectedId = form.watch("studentId");
  const selected = studentsQuery.data?.students.find((student) => student.id === selectedId);

  return (
    <section className="mx-auto grid max-w-3xl gap-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-pine uppercase">Administrator</p>
        <h1 className="mt-2 font-serif text-4xl">Add fee</h1>
        <p className="mt-3 leading-7 text-slate-700">
          Create a fee for a student profile that already exists. Recording a payment is a separate step.
        </p>
      </div>
      {serverError ? <ServerErrorAlert error={serverError} /> : null}
      <form className="grid gap-4" onSubmit={form.handleSubmit((values) => mutation.mutate(values))} noValidate>
        <div className="grid gap-4 rounded-xl border border-line bg-white p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-60 flex-1">
              <TextField
                label="Find a student"
                name="studentSearch"
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                hint="Search by name or student ID, then choose the account."
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => setStudentQueryText(studentSearch.trim())}>
              Find student
            </Button>
          </div>
          {studentsQuery.isFetching ? <p className="text-sm text-slate-600">Searching students</p> : null}
          {studentsQuery.error ? <ServerErrorAlert error={getApiErrorMessage(studentsQuery.error)} /> : null}
          {studentsQuery.data && studentsQuery.data.students.length === 0 ? (
            <p className="text-sm text-slate-700">No students matched that search.</p>
          ) : null}
          {studentsQuery.data && studentsQuery.data.students.length > 0 ? (
            <SelectField
              label="Student"
              name="studentChoice"
              value={selectedId}
              onChange={(event) => form.setValue("studentId", event.target.value, { shouldValidate: true })}
            >
              <option value="">Choose a student</option>
              {studentsQuery.data.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {feeStudentLabel({
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    studentId: student.studentId,
                  })}
                </option>
              ))}
            </SelectField>
          ) : null}
          {selected ? <p className="text-sm text-slate-700">Selected {feeStudentLabel({ id: selected.id, firstName: selected.firstName, lastName: selected.lastName, studentId: selected.studentId })}</p> : null}
        </div>
        <FeeFields form={form} includeStudent />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" busy={mutation.isPending}>
            {mutation.isPending ? "Saving" : "Create fee"}
          </Button>
          <Link to="/app/fees" className={buttonClass("secondary")}>
            Cancel
          </Link>
        </div>
      </form>
    </section>
  );
}
