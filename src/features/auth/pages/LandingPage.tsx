import { Link } from "react-router";
import { buttonClass } from "../../../components/ui/Button";

export function LandingPage() {
  return (
    <section className="mx-auto grid max-w-5xl gap-10 px-4 py-14 md:grid-cols-[1.3fr_0.7fr] md:items-center md:py-20">
      <div>
        <p className="text-sm font-medium tracking-[0.14em] text-pine uppercase">
          School management
        </p>
        <h1 className="mt-3 font-serif text-4xl text-ink md:text-6xl">SchoolOS</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-700">
          Sign in to your school account. New registrations start as standard users.
          An administrator links a student or teacher profile separately.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/login" className={buttonClass("primary")}>
            Sign in
          </Link>
          <Link to="/register" className={buttonClass("secondary")}>
            Create account
          </Link>
        </div>
      </div>
      <aside className="rounded-2xl border border-line bg-white p-6">
        <h2 className="font-serif text-2xl">Available now</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-700">
          <li>Create an account and sign in</li>
          <li>Keep your session with a secure refresh cookie</li>
          <li>Update your profile and change your password</li>
        </ul>
      </aside>
    </section>
  );
}
