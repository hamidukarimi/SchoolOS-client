import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router";
import { ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { useAuth } from "../auth-context";
import { registerFormSchema, toRegisterPayload, type RegisterFormValues } from "../schemas";

const emptyRegisterForm: RegisterFormValues = {
  firstname: "",
  lastname: "",
  username: "",
  email: "",
  password: "",
  birthday: "",
  gender: "",
  city: "",
  country: "",
  avatar: "",
};

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: emptyRegisterForm,
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await registerAccount(toRegisterPayload(values));
      navigate("/app/profile", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
        <h1 className="font-serif text-3xl">Create account</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This creates a standard user account. It does not grant administrator access or a
          student, teacher, or staff profile.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError ? <ServerErrorAlert error={serverError} /> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" autoComplete="given-name" error={errors.firstname?.message} {...register("firstname")} />
            <TextField label="Last name" autoComplete="family-name" error={errors.lastname?.message} {...register("lastname")} />
          </div>
          <TextField label="Username" autoComplete="username" spellCheck={false} error={errors.username?.message} {...register("username")} />
          <TextField label="Email" type="email" autoComplete="email" spellCheck={false} error={errors.email?.message} {...register("email")} />
          <TextField label="Password" type="password" autoComplete="new-password" hint="At least 6 characters." error={errors.password?.message} {...register("password")} />

          <fieldset className="grid gap-4 rounded-xl border border-line p-4">
            <legend className="px-1 text-sm font-medium">Optional details</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Birthday" type="date" error={errors.birthday?.message} {...register("birthday")} />
              <SelectField label="Gender" error={errors.gender?.message} {...register("gender")}>
                <option value="">Not specified</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </SelectField>
              <TextField label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
              <TextField label="Country" autoComplete="country-name" error={errors.country?.message} {...register("country")} />
            </div>
            <TextField
              label="Avatar URL"
              type="url"
              spellCheck={false}
              hint="A link to an image. File upload is not available."
              error={errors.avatar?.message}
              {...register("avatar")}
            />
          </fieldset>

          <Button type="submit" busy={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Already registered?{" "}
          <Link to="/login" className="font-medium text-pine underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
