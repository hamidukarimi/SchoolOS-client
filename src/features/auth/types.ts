export type UserRole = "user" | "admin";
export type Gender = "male" | "female" | "other";

export interface UserLocation {
  city?: string;
  country?: string;
}

export interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  birthday?: string;
  gender?: Gender;
  location?: UserLocation;
  avatar?: string;
  role: UserRole;
  isBlocked: boolean;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSuccess<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface SessionPayload {
  user: UserProfile;
  accessToken: string;
}
