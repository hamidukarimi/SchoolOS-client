import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { FullPageSpinner } from "../../../components/ui/Spinner";
import { TextField } from "../../../components/ui/TextField";
import { getApiErrorMessage, type ParsedApiError } from "../../../services/api-error";
import { fetchMyProfile, updateMyProfile } from "../api";
import { useAuth } from "../auth-context";
import { updateSessionUser } from "../../../services/session-store";
import {
  profileFormSchema,
  toDateInputValue,
  toProfileUpdatePayload,
  type ProfileFormValues,
} from "../schemas";
import type { UserProfile } from "../types";

function toFormValues(user: UserProfile): ProfileFormValues {
  return {
    firstname: user.firstname,
    lastname: user.lastname,
    username: user.username,
    avatar: user.avatar ?? "",
    birthday: toDateInputValue(user.birthday),
    gender: user.gender ?? "",
  };
}

function roleLabel(role: UserProfile["role"]): string {
  return role === "admin" ? "Administrator" : "User";
}

export function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<ParsedApiError | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMyProfile,
    placeholderData: user ?? undefined,
  });

  const profile = profileQuery.data ?? user;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: profile ? toFormValues(profile) : undefined,
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    updateSessionUser(profileQuery.data);
    if (!isDirty) {
      reset(toFormValues(profileQuery.data));
    }
  }, [profileQuery.data, isDirty, reset]);

  const mutation = useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (result) => {
      queryClient.setQueryData(["me"], result.user);
      updateSessionUser(result.user);
      reset(toFormValues(result.user));
      setSuccessMessage(result.message);
      setServerError(null);
    },
    onError: (error) => {
      setSuccessMessage(null);
      setServerError(getApiErrorMessage(error));
    },
  });

  if (!profile && profileQuery.isLoading) {
    return <FullPageSpinner label="Loading your profile" />;
  }

  if (!profile) {
    return (
      <ServerErrorAlert
        error={
          profileQuery.error
            ? getApiErrorMessage(profileQuery.error)
            : { message: "Your profile could not be loaded.", errors: [] }
        }
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-line bg-white p-5">
        <h1 className="font-serif text-3xl">Profile</h1>
        <dl className="mt-5 grid gap-4 text-sm">
          <div>
            <dt className="text-slate-500">Email</dt>
            <dd className="mt-1 font-medium break-all">{profile.email}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Role</dt>
            <dd className="mt-1 font-medium">{roleLabel(profile.role)}</dd>
          </div>
          {profile.location?.city || profile.location?.country ? (
            <div>
              <dt className="text-slate-500">Location</dt>
              <dd className="mt-1 font-medium">
                {[profile.location.city, profile.location.country].filter(Boolean).join(", ")}
              </dd>
              <p className="mt-1 text-slate-500">Location is set at registration and cannot be edited here.</p>
            </div>
          ) : null}
        </dl>
      </aside>

      <section className="rounded-2xl border border-line bg-white p-5 md:p-6">
        <h2 className="font-serif text-2xl">Account details</h2>
        <p className="mt-2 text-sm text-slate-600">
          Email and role stay read-only. An avatar is a URL, not a file upload.
        </p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={handleSubmit(async (values) => {
            setSuccessMessage(null);
            setServerError(null);
            try {
              await mutation.mutateAsync(toProfileUpdatePayload(values));
            } catch {
              // The mutation error state renders the server message.
            }
          })}
          noValidate
        >
          {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}
          {serverError ? <ServerErrorAlert error={serverError} /> : null}
          {profileQuery.isError ? (
            <ServerErrorAlert error={getApiErrorMessage(profileQuery.error)} />
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="First name" autoComplete="given-name" error={errors.firstname?.message} {...register("firstname")} />
            <TextField label="Last name" autoComplete="family-name" error={errors.lastname?.message} {...register("lastname")} />
          </div>
          <TextField label="Username" autoComplete="username" spellCheck={false} error={errors.username?.message} {...register("username")} />
          <TextField label="Birthday" type="date" error={errors.birthday?.message} {...register("birthday")} />
          <SelectField label="Gender" error={errors.gender?.message} {...register("gender")}>
            <option value="">Not specified</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </SelectField>
          <TextField
            label="Avatar URL"
            type="url"
            spellCheck={false}
            hint="Leave blank to keep the current avatar unchanged."
            error={errors.avatar?.message}
            {...register("avatar")}
          />
          <Button type="submit" busy={isSubmitting || mutation.isPending}>
            {isSubmitting || mutation.isPending ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </section>
    </div>
  );
}
