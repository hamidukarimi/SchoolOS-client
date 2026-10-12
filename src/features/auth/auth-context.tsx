import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { loginRequest, logoutAllRequest, logoutRequest, registerRequest } from "./api";
import type { RegisterPayload } from "./schemas";
import type { UserProfile } from "./types";
import { endSession } from "../../services/end-session";
import { bootstrapSession } from "../../services/http";
import {
  clearSession,
  getSessionSnapshot,
  setAuthenticated,
  subscribeSession,
  updateSessionUser,
  type SessionStatus,
} from "../../services/session-store";

interface AuthContextValue {
  status: SessionStatus;
  user: UserProfile | null;
  login: (input: { email: string; password: string }) => Promise<void>;
  register: (input: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function useSessionSnapshot() {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getSessionSnapshot);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useSessionSnapshot();

  useEffect(() => {
    void bootstrapSession();
  }, []);

  const value: AuthContextValue = {
    status: session.status,
    user: session.user,
    async login(input) {
      const result = await loginRequest(input);
      setAuthenticated(result.user, result.accessToken);
    },
    async register(input) {
      const result = await registerRequest(input);
      setAuthenticated(result.user, result.accessToken);
    },
    async logout() {
      await endSession(logoutRequest, () => {
        clearSession();
        queryClient.clear();
      });
    },
    async logoutAll() {
      await endSession(logoutAllRequest, () => {
        clearSession();
        queryClient.clear();
      });
    },
    updateUser(user) {
      updateSessionUser(user);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return value;
}
