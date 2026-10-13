import { Menu, X, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { buttonClass } from "../components/ui/Button";
import { useAccess } from "../features/access/access-context";
import { accountNavigation, navigationFor, personaLabel, type NavItem } from "../features/access/navigation";
import { useAuth } from "../features/auth/auth-context";
import { UnreadCountBadge } from "../features/notifications/UnreadCountBadge";

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
              <Link to="/app" className={buttonClass("primary")}>
                Open SchoolOS
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

function navLinkClass(isActive: boolean): string {
  return [
    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine",
    isActive ? "bg-mist text-ink" : "text-slate-700 hover:bg-paper",
  ].join(" ");
}

function SidebarNav({ items }: { items: NavItem[] }) {
  return (
    <ul className="grid gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li key={item.to}>
            <NavLink to={item.to} end={item.end} className={({ isActive }) => navLinkClass(isActive)}>
              <Icon aria-hidden="true" size={18} />
              <span className="min-w-0 flex-1">{item.label}</span>
              {item.to === "/app/notifications" ? <UnreadCountBadge /> : null}
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}

export function AppLayout() {
  const { user, logout } = useAuth();
  const access = useAccess();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const items =
    access.status === "ready" && access.context
      ? navigationFor(access.context.persona)
      : accountNavigation();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const accessSummary =
    access.status === "ready" && access.context
      ? access.context.accountRole === "admin"
        ? "Account role: Administrator"
        : `Account role: User · ${personaLabel(access.context.persona)}`
      : access.status === "error"
        ? "Access unknown"
        : "Checking access";

  return (
    <div className="min-h-screen md:grid md:grid-cols-[16rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-20 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <aside className="hidden border-r border-line bg-white md:flex md:min-h-screen md:flex-col">
        <div className="border-b border-line px-4 py-5">
          <Link to="/app" className="font-serif text-2xl text-ink">
            SchoolOS
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4" aria-label="School">
          <SidebarNav items={items} />
        </nav>
      </aside>
      <div className="min-w-0">
        <header className="border-b border-line bg-white">
          <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={`${buttonClass("secondary")} px-3 md:hidden`}
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
                <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
                <span className="md:hidden">
                  <UnreadCountBadge />
                </span>
              </button>
              <div>
                <p className="text-sm font-medium text-ink">
                  {user ? `${user.firstname} ${user.lastname}` : "Account"}
                </p>
                <p className="text-sm text-slate-600">{accessSummary}</p>
              </div>
            </div>
            <button type="button" className={buttonClass("ghost")} onClick={() => void handleLogout()}>
              <LogOut aria-hidden="true" size={16} />
              Log out
            </button>
          </div>
          {menuOpen ? (
            <nav id="mobile-navigation" className="border-t border-line px-3 py-3 md:hidden" aria-label="School">
              <SidebarNav items={items} />
            </nav>
          ) : null}
        </header>
        <main id="main" className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
