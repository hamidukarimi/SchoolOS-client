import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { ACCOUNT_GENDERS } from "../types";

export interface AccountIdentityValues {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  birthday: string;
  gender: "" | "male" | "female" | "other";
  city: string;
  country: string;
}

export function AccountFields({
  register,
  errors,
  passwordHint,
  passwordDisabled = false,
}: {
  register: UseFormRegister<AccountIdentityValues>;
  errors: FieldErrors<AccountIdentityValues>;
  passwordHint: string;
  passwordDisabled?: boolean;
}) {
  const message = (name: keyof AccountIdentityValues) => errors[name]?.message;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="First name" error={message("firstname")} {...register("firstname")} />
        <TextField label="Last name" error={message("lastname")} {...register("lastname")} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Username" error={message("username")} {...register("username")} />
        <TextField label="Email" type="email" autoComplete="off" error={message("email")} {...register("email")} />
      </div>
      <TextField
        label="Password"
        type="password"
        autoComplete="new-password"
        error={message("password")}
        hint={passwordHint}
        disabled={passwordDisabled}
        {...register("password")}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Birthday" type="date" error={message("birthday")} {...register("birthday")} />
        <SelectField label="Gender" error={message("gender")} {...register("gender")}>
          <option value="">Not set</option>
          {ACCOUNT_GENDERS.map((gender) => (
            <option key={gender} value={gender}>
              {gender}
            </option>
          ))}
        </SelectField>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="City" error={message("city")} {...register("city")} />
        <TextField label="Country" error={message("country")} {...register("country")} />
      </div>
    </>
  );
}
