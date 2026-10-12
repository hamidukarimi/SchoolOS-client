import { z } from "zod";

const genderSchema = z.enum(["male", "female", "other"]);

export const loginFormSchema = z.object({
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerFormSchema = z.object({
  firstname: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  lastname: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  username: z
    .string()
    .trim()
    .min(2, "username must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  birthday: z.string(),
  gender: z.union([z.literal(""), genderSchema]),
  city: z.string().trim().max(100, "City must be at most 100 characters"),
  country: z.string().trim().max(100, "Country must be at most 100 characters"),
  avatar: z.string().trim(),
});

export const profileFormSchema = z.object({
  firstname: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  lastname: z
    .string()
    .trim()
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be at most 50 characters"),
  username: z
    .string()
    .trim()
    .min(2, "username must be at least 2 characters")
    .max(50, "Name must be at most 50 characters"),
  avatar: z.string().trim().refine((value) => {
    if (!value) return true;
    return z.string().url().safeParse(value).success;
  }, "Avatar must be a valid URL"),
  birthday: z.string(),
  gender: z.union([z.literal(""), genderSchema]),
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;

export interface RegisterPayload {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
  location?: {
    city?: string;
    country?: string;
  };
  avatar?: string;
}

export interface UpdateProfilePayload {
  firstname: string;
  lastname: string;
  username: string;
  avatar?: string;
  birthday?: string;
  gender?: "male" | "female" | "other";
}

export function toRegisterPayload(values: RegisterFormValues): RegisterPayload {
  const payload: RegisterPayload = {
    firstname: values.firstname.trim(),
    lastname: values.lastname.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
    password: values.password,
  };

  if (values.birthday) payload.birthday = values.birthday;
  if (values.gender) payload.gender = values.gender;
  if (values.avatar) payload.avatar = values.avatar;

  const city = values.city.trim();
  const country = values.country.trim();
  if (city || country) {
    payload.location = {
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
    };
  }

  return payload;
}

export function toProfileUpdatePayload(
  values: ProfileFormValues,
): UpdateProfilePayload {
  const payload: UpdateProfilePayload = {
    firstname: values.firstname.trim(),
    lastname: values.lastname.trim(),
    username: values.username.trim(),
  };

  if (values.avatar) payload.avatar = values.avatar.trim();
  if (values.birthday) payload.birthday = values.birthday;
  if (values.gender) payload.gender = values.gender;

  return payload;
}

export function toDateInputValue(value?: string): string {
  if (!value) return "";
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? "";
}
