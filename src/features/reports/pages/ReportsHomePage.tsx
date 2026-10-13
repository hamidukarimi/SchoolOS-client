import { Link } from "react-router";
import { useAccess } from "../../access/access-context";
import { reportIntro, reportsFor } from "../display";

export function ReportsHomePage() {
  const access = useAccess();
  const reports = reportsFor(access.context?.persona);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-serif text-4xl">Reports</h1>
        <p className="mt-3 max-w-3xl leading-7 text-slate-700">{reportIntro(access.context?.persona)}</p>
      </div>
      {reports.length === 0 ? (
        <p className="text-sm text-slate-600">No reports are available for this account.</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {reports.map((report) => (
            <li key={report.id}>
              <Link
                to={`/app/reports/${report.id}`}
                className="grid gap-2 rounded-xl border border-line bg-white px-4 py-4 hover:border-pine focus-visible:ring-2 focus-visible:ring-pine focus-visible:outline-none"
              >
                <span className="font-medium text-ink">{report.title}</span>
                <span className="text-sm leading-6 text-slate-600">{report.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
