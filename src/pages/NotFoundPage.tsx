import { Link } from "react-router";
import { buttonClass } from "../components/ui/Button";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-lg px-4 py-20">
      <p className="text-sm font-medium text-pine">404</p>
      <h1 className="mt-2 font-serif text-4xl">Page not found</h1>
      <p className="mt-3 text-slate-700">That address is not part of SchoolOS.</p>
      <Link to="/" className={`${buttonClass("primary")} mt-6`}>
        Back to home
      </Link>
    </section>
  );
}
