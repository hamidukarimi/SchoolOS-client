import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { changePasswordRequest } from "../api";
import { useAuth } from "../auth-context";
import { changePasswordFormSchema, type ChangePasswordFormValues } from "../schemas";

export function ChangePasswordPage() {
  const { logout, logoutAll } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [logoutAllError, setLogoutAllError] = useState<ParsedApiError | null>(null);
  const [endingAllSessions, setEndingAllSessions] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordFormValues) {
    setServerError(null);
    try {
      await changePasswordRequest({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await logout();
      navigate("/login", {
        replace: true,
        state: {
          notice: "Password changed. Please sign in again.",
        },
      });
    } catch (error) {
      setServerError(getApiErrorMessage(error));
    }
  }

  async function handleLogoutAll() {
    setLogoutAllError(null);
    setEndingAllSessions(true);
    try {
      await logoutAll();
      navigate("/login", {
        replace: true,
        state: { notice: "You have been signed out of all devices." },
      });
    } catch (error) {
      setLogoutAllError(getApiErrorMessage(error));
      setEndingAllSessions(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <h1 className="font-serif text-3xl">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Changing your password ends every current session. You will need to sign in again.
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          {serverError ? <ServerErrorAlert error={serverError} /> : null}
          <TextField
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register("currentPassword")}
          />
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 6 characters."
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />
          <Button type="submit" busy={isSubmitting}>
            {isSubmitting ? "Updating password..." : "Update password"}
          </Button>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <h2 className="font-serif text-2xl">Other sessions</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Log out of every device that is signed in to this account, including this browser.
        </p>
        {logoutAllError ? (
          <div className="mt-4">
            <ServerErrorAlert error={logoutAllError} />
          </div>
        ) : null}
        {confirmLogoutAll ? (
          <div className="mt-5 grid gap-3">
            <Alert tone="info">This ends every signed-in session for your account.</Alert>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="danger" busy={endingAllSessions} onClick={() => void handleLogoutAll()}>
                {endingAllSessions ? "Signing out..." : "Log out everywhere"}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setConfirmLogoutAll(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" className="mt-5" variant="secondary" onClick={() => setConfirmLogoutAll(true)}>
            Log out of all devices
          </Button>
        )}
      </section>
    </div>
  );
}
