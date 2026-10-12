import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { useAuth } from "../auth-context";
import { loginFormSchema, type LoginFormValues } from "../schemas";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = (location.state as { notice?: string; from?: string } | null)?.notice;
  const from = (location.state as { from?: string } | null)?.from;
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values);
      const destination = from && from.startsWith("/app/") ? from : "/app/profile";
      navigate(destination, { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border border-line bg-white p-6 md:p-8">
        <h1 className="font-serif text-3xl">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use the email and password for your SchoolOS account.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {notice ? <Alert tone="success">{notice}</Alert> : null}
          {serverError ? <ServerErrorAlert error={serverError} /> : null}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            error={errors.email?.message}
            {...register("email")}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" busy={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          Need an account?{" "}
          <Link to="/register" className="font-medium text-pine underline-offset-2 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}
