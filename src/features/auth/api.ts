import type { ApiSuccess, SessionPayload, UserProfile } from "./types";
import type { RegisterPayload, UpdateProfilePayload } from "./schemas";
import { http } from "../../services/http";

function requireSession(data: SessionPayload | undefined, action: string): SessionPayload {
  if (!data?.accessToken || !data.user) {
    throw new Error(`${action} response did not include a session.`);
  }

  return data;
}

export async function loginRequest(input: {
  email: string;
  password: string;
}): Promise<SessionPayload> {
  const response = await http.post<ApiSuccess<SessionPayload>>("/sessions", input);
  return requireSession(response.data.data, "Login");
}

export async function registerRequest(input: RegisterPayload): Promise<SessionPayload> {
  const response = await http.post<ApiSuccess<SessionPayload>>("/users", input);
  return requireSession(response.data.data, "Registration");
}

export async function fetchMyProfile(): Promise<UserProfile> {
  const response = await http.get<ApiSuccess<{ user: UserProfile }>>("/users/me");
  const user = response.data.data?.user;

  if (!user) {
    throw new Error("Profile response did not include a user.");
  }

  return user;
}

export async function updateMyProfile(
  input: UpdateProfilePayload,
): Promise<{ user: UserProfile; message: string }> {
  const response = await http.put<ApiSuccess<{ user: UserProfile }>>("/users/me", input);
  const user = response.data.data?.user;

  if (!user) {
    throw new Error("Profile update did not return a user.");
  }

  return {
    user,
    message: response.data.message ?? "Profile updated successfully",
  };
}

export async function changePasswordRequest(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<string> {
  const response = await http.put<ApiSuccess<undefined>>("/users/me/password", input);
  return response.data.message ?? "Password changed successfully. Please login again.";
}

export async function logoutRequest(): Promise<void> {
  await http.post("/logout");
}

export async function logoutAllRequest(): Promise<void> {
  await http.post("/logout/all");
}
