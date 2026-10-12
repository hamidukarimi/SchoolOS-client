import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "../auth/auth-context";
import { loadAccessContext } from "./api";
import type { AccessContext } from "./types";

export type AccessStatus = "idle" | "loading" | "ready" | "error";

interface AccessState {
  status: AccessStatus;
  context: AccessContext | null;
  errorMessage: string | null;
  retry: () => void;
}

const AccessContextState = createContext<AccessState | null>(null);

export function AccessProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const enabled = status === "authenticated" && user != null;

  const query = useQuery({
    queryKey: ["school-access", user?.id, user?.role],
    enabled,
    queryFn: () => {
      if (!user) {
        throw new Error("School access cannot be resolved without a signed-in account.");
      }
      return loadAccessContext(user);
    },
  });

  let accessStatus: AccessStatus = "idle";
  if (enabled && query.isPending) accessStatus = "loading";
  else if (enabled && query.isError) accessStatus = "error";
  else if (enabled && query.data) accessStatus = "ready";

  const errorMessage =
    query.error instanceof Error
      ? query.error.message
      : query.isError
        ? "School access could not be verified."
        : null;

  const value: AccessState = {
    status: accessStatus,
    context: query.data ?? null,
    errorMessage,
    retry: () => {
      void query.refetch();
    },
  };

  return <AccessContextState.Provider value={value}>{children}</AccessContextState.Provider>;
}

export function useAccess(): AccessState {
  const value = useContext(AccessContextState);
  if (!value) {
    throw new Error("useAccess must be used within AccessProvider.");
  }
  return value;
}
