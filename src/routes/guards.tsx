import { Navigate, Outlet, useLocation } from "react-router";
import { FullPageSpinner } from "../components/ui/Spinner";
import { useAccess } from "../features/access/access-context";
import { homePathFor } from "../features/access/navigation";
import type { SchoolPersona } from "../features/access/types";
import { AccessErrorState, UnauthorizedPage } from "../features/access/pages/AccessPages";
import { useAuth } from "../features/auth/auth-context";

function safeReturnPath(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/app/")) return value;
  return "/app";
}

export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "unknown") {
    return <FullPageSpinner label="Checking your session" />;
  }

  if (status === "anonymous") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: unknown } | null)?.from;

  if (status === "unknown") {
    return <FullPageSpinner label="Checking your session" />;
  }

  if (status === "authenticated") {
    return <Navigate to={safeReturnPath(from)} replace />;
  }

  return <Outlet />;
}

export function RequirePersona({ allow }: { allow: SchoolPersona | readonly SchoolPersona[] }) {
  const access = useAccess();
  const allowed = Array.isArray(allow) ? allow : [allow];

  if (access.status === "idle" || access.status === "loading") {
    return <FullPageSpinner label="Checking school access" />;
  }

  if (access.status === "error" || !access.context) {
    return <AccessErrorState />;
  }

  if (!allowed.includes(access.context.persona)) {
    return <UnauthorizedPage />;
  }

  return <Outlet />;
}

export function AppHomeRedirect() {
  const access = useAccess();

  if (access.status === "idle" || access.status === "loading") {
    return <FullPageSpinner label="Checking school access" />;
  }

  if (access.status === "error" || !access.context) {
    return <AccessErrorState />;
  }

  return <Navigate to={homePathFor(access.context.persona)} replace />;
}
