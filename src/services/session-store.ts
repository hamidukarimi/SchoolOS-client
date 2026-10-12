import type { UserProfile } from "../features/auth/types";
import { setAccessToken } from "./token";

export type SessionStatus = "unknown" | "authenticated" | "anonymous";

export interface SessionSnapshot {
  status: SessionStatus;
  user: UserProfile | null;
}

type Listener = () => void;

let snapshot: SessionSnapshot = {
  status: "unknown",
  user: null,
};

const listeners = new Set<Listener>();

function emit(next: SessionSnapshot): void {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

export function getSessionSnapshot(): SessionSnapshot {
  return snapshot;
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAuthenticated(user: UserProfile, token: string): void {
  setAccessToken(token);
  emit({ status: "authenticated", user });
}

export function updateSessionUser(user: UserProfile): void {
  if (snapshot.status !== "authenticated") return;
  emit({ status: "authenticated", user });
}

export function clearSession(): void {
  setAccessToken(null);
  emit({ status: "anonymous", user: null });
}
