import { Navigate, Outlet, useLocation } from "react-router";
import { FullPageSpinner } from "../components/ui/Spinner";
import { useAuth } from "../features/auth/auth-context";

function safeReturnPath(value: unknown): string {
  if (typeof value === "string" && value.startsWith("/app/")) return value;
  return "/app/profile";
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
