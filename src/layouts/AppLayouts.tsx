import { KeyRound, LogOut, UserRound } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../features/auth/auth-context";
import { buttonClass } from "../components/ui/Button";

export function MarketingLayout() {
  const { status } = useAuth();

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link to="/" className="font-serif text-2xl text-ink">
            SchoolOS
          </Link>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Account">
            {status === "authenticated" ? (
              <Link to="/app/profile" className={buttonClass("primary")}>
                Your profile
              </Link>
            ) : (
              <>
                <Link to="/login" className={buttonClass("ghost")}>
                  Sign in
                </Link>
                <Link to="/register" className={buttonClass("primary")}>
                  Create account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
    </div>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-10 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <Link to="/app/profile" className="font-serif text-2xl text-ink">
              SchoolOS
            </Link>
            {user ? (
              <p className="text-sm text-slate-600">
                {user.firstname} {user.lastname}
              </p>
            ) : null}
          </div>
          <nav className="flex flex-wrap items-center gap-2" aria-label="Account">
            <NavLink
              to="/app/profile"
              end
              className={({ isActive }) => buttonClass(isActive ? "secondary" : "ghost")}
            >
              <UserRound aria-hidden="true" size={16} />
              Profile
            </NavLink>
            <NavLink
              to="/app/profile/password"
              className={({ isActive }) => buttonClass(isActive ? "secondary" : "ghost")}
            >
              <KeyRound aria-hidden="true" size={16} />
              Password
            </NavLink>
            <button type="button" className={buttonClass("ghost")} onClick={() => void handleLogout()}>
              <LogOut aria-hidden="true" size={16} />
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
