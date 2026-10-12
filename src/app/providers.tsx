import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import axios from "axios";
import type { ReactNode } from "react";
import { AuthProvider } from "../features/auth/auth-context";
import { AccessProvider } from "../features/access/access-context";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (axios.isAxiosError(error) && error.response?.status === 401) return false;
        return failureCount < 1;
      },
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AccessProvider>{children}</AccessProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
