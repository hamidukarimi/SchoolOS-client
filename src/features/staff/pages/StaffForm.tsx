import type { UseFormRegister, FieldErrors } from "react-hook-form";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { staffContractLabel, staffStatusLabel } from "../display";
import type { StaffFormValues } from "../schemas";
import { STAFF_CONTRACT_TYPES, STAFF_GENDERS, STAFF_STATUSES } from "../types";

export function StaffFields({
  register,
  errors,
}: {
  register: UseFormRegister<StaffFormValues>;
  errors: FieldErrors<StaffFormValues>;
}) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="First name" error={errors.firstName?.message} {...register("firstName")} />
        <TextField label="Last name" error={errors.lastName?.message} {...register("lastName")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Date of birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
        <SelectField label="Gender" error={errors.gender?.message} {...register("gender")}>
          {STAFF_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField label="Phone" error={errors.phone?.message} {...register("phone")} />
      <TextField label="Address" error={errors.address?.message} {...register("address")} />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Department" error={errors.department?.message} {...register("department")} />
        <TextField label="Position" error={errors.position?.message} {...register("position")} />
      </div>
      <TextField label="Salary" error={errors.salary?.message} {...register("salary")} />
      <TextField label="Join date" type="date" error={errors.joinDate?.message} {...register("joinDate")} />
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Contract type" error={errors.contractType?.message} {...register("contractType")}>
          {STAFF_CONTRACT_TYPES.map((contractType) => (
            <option key={contractType} value={contractType}>
              {staffContractLabel(contractType)}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" error={errors.status?.message} {...register("status")}>
          {STAFF_STATUSES.map((status) => (
            <option key={status} value={status}>
              {staffStatusLabel(status)}
            </option>
          ))}
        </SelectField>
      </div>
    </>
  );
}
