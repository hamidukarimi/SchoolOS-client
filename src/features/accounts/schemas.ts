import { z } from "zod";
import { ACCOUNT_GENDERS, ACCOUNT_ROLES, ACCOUNT_STATUSES, type AccountGender, type AccountUpdatePayload, type AccountWritePayload } from "./types";

const accountFields = {
  firstname: z.string().trim().min(2, "First name must be at least 2 characters").max(50),
  lastname: z.string().trim().min(2, "Last name must be at least 2 characters").max(50),
  username: z.string().trim().min(2, "Username must be at least 2 characters").max(50),
  email: z.string().trim().email("Enter a valid email"),
  birthday: z.string(),
  gender: z.union([z.literal(""), z.enum(ACCOUNT_GENDERS)]),
  city: z.string().max(100, "City must be at most 100 characters"),
  country: z.string().max(100, "Country must be at most 100 characters"),
};

export const createAccountFormSchema = z.object({
  ...accountFields,
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(ACCOUNT_ROLES),
});

export type CreateAccountFormValues = z.infer<typeof createAccountFormSchema>;

export const editAccountFormSchema = z.object({
  ...accountFields,
  password: z.string().refine((value) => value.trim().length === 0 || value.trim().length >= 6, {
    message: "Password must be at least 6 characters",
  }),
  role: z.enum(ACCOUNT_ROLES),
  status: z.enum(ACCOUNT_STATUSES),
});

export type EditAccountFormValues = z.infer<typeof editAccountFormSchema>;

function sharedPayload(values: CreateAccountFormValues | EditAccountFormValues) {
  const payload: {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    birthday?: string;
    gender?: AccountGender;
    location?: { city?: string; country?: string };
  } = {
    firstname: values.firstname.trim(),
    lastname: values.lastname.trim(),
    username: values.username.trim(),
    email: values.email.trim(),
  };
  const birthday = values.birthday.trim();
  if (birthday) payload.birthday = birthday;
  if (values.gender) payload.gender = values.gender;
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

export function toAccountCreatePayload(values: CreateAccountFormValues): AccountWritePayload {
  return {
    ...sharedPayload(values),
    password: values.password,
    role: values.role,
  };
}

export function toAccountUpdatePayload(values: EditAccountFormValues, lockAccess: boolean): AccountUpdatePayload {
  const payload: AccountUpdatePayload = {
    ...sharedPayload(values),
  };
  if (!lockAccess) {
    payload.role = values.role;
    payload.isActive = values.status === "active";
    const password = values.password.trim();
    if (password) payload.password = password;
  }
  return payload;
}
