import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router";
import { Alert, ServerErrorAlert } from "../../../components/ui/Alert";
import { Button, buttonClass } from "../../../components/ui/Button";
import { SelectField } from "../../../components/ui/SelectField";
import { Spinner } from "../../../components/ui/Spinner";
import { useAccess } from "../../access/access-context";
import { getApiErrorMessage } from "../../../services/api-error";
import { announcementListKey, fetchAnnouncements } from "../api";
import {
  announcementListIntroduction,
  audienceLabel,
  canManageAnnouncements,
  formatAnnouncementDate,
  readNotice,
} from "../display";
import { announcementListQueryForPersona, announcementListSearch, audiencesForPersona, parseAnnouncementListQuery } from "../query";
import type { AnnouncementListQuery } from "../types";

function replaceQuery(
  setSearchParams: (next: URLSearchParams) => void,
  current: AnnouncementListQuery,
  next: Partial<AnnouncementListQuery>,
) {
  const query = { ...current, ...next };
  setSearchParams(new URLSearchParams(announcementListSearch(query).replace(/^\?/, "")));
}

export function AnnouncementListPage() {
  const access = useAccess();
  const location = useLocation();
  const notice = readNotice(location.state);
  const persona = access.context?.persona;
  const [searchParams, setSearchParams] = useSearchParams();
  const query = announcementListQueryForPersona(parseAnnouncementListQuery(searchParams), persona);
  const listQuery = useQuery({
    queryKey: announcementListKey(query),
    queryFn: () => fetchAnnouncements(query),
  });
  const audiences = audiencesForPersona(persona);
  const filtered = Boolean(query.audience || query.published || query.classId);

  return (
    <section className="mx-auto grid max-w-5xl gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl">Announcements</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-700">{announcementListIntroduction(persona)}</p>
        </div>
        {canManageAnnouncements(persona) ? (
          <Link to="/app/announcements/new" className={buttonClass("primary")}>
            New announcement
          </Link>
        ) : null}
      </div>
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {audiences.length > 1 || persona === "admin" ? (
      <form className="grid gap-4 rounded-xl border border-line bg-white p-4 md:grid-cols-2">
        {audiences.length > 1 ? (
          <SelectField
            label="Audience"
            name="audience"
            value={query.audience}
            onChange={(event) =>
              replaceQuery(setSearchParams, query, {
                audience: event.target.value as AnnouncementListQuery["audience"],
                page: 1,
              })
            }
          >
            <option value="">Allowed audiences</option>
            {audiences.map((audience) => (
              <option key={audience} value={audience}>
                {audienceLabel(audience)}
              </option>
            ))}
          </SelectField>
        ) : null}
        {persona === "admin" ? (
          <SelectField
            label="Publication"
            name="published"
            value={query.published}
            onChange={(event) =>
              replaceQuery(setSearchParams, query, {
                published: event.target.value as AnnouncementListQuery["published"],
                page: 1,
              })
            }
          >
            <option value="">Published and drafts</option>
            <option value="true">Published</option>
            <option value="false">Drafts</option>
          </SelectField>
        ) : null}
      </form>
      ) : null}
      {listQuery.isLoading ? <Spinner label="Loading announcements" /> : null}
      {listQuery.error ? (
        <div className="grid gap-3">
          <ServerErrorAlert error={getApiErrorMessage(listQuery.error)} />
          <Button type="button" variant="secondary" onClick={() => void listQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : null}
      {listQuery.data && listQuery.data.announcements.length === 0 ? (
        <Alert tone="info" title={filtered ? "No announcements match this filter" : "No announcements"}>
          {filtered ? "Try another audience or publication filter." : "Nothing has been posted for this account."}
        </Alert>
      ) : null}
      {listQuery.data && listQuery.data.announcements.length > 0 ? (
        <div className="grid gap-4">
          <p className="text-sm text-slate-600" aria-live="polite">
            {listQuery.data.total} {listQuery.data.total === 1 ? "announcement" : "announcements"}
            {listQuery.data.totalPages > 1 ? `, page ${listQuery.data.page} of ${listQuery.data.totalPages}` : ""}
          </p>
          <ul className="grid gap-3">
            {listQuery.data.announcements.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/app/announcements/${item.id}`}
                  className="grid gap-1 rounded-xl border border-line bg-white px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pine hover:border-pine"
                >
                  <span className="font-medium text-ink">{item.title}</span>
                  <span className="text-sm text-slate-600">
                    {audienceLabel(item.audience)}
                    {item.classRef ? ` · ${item.classRef.name}, section ${item.classRef.section}` : ""}
                    {persona === "admin" && !item.isPublished ? " · Draft" : ""}
                  </span>
                  <span className="text-sm text-slate-600">{formatAnnouncementDate(item.publishDate)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {listQuery.data.totalPages > 1 ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={listQuery.data.page <= 1}
                onClick={() => replaceQuery(setSearchParams, query, { page: listQuery.data ? listQuery.data.page - 1 : 1 })}
              >
                Previous page
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={listQuery.data.page >= listQuery.data.totalPages}
                onClick={() => replaceQuery(setSearchParams, query, { page: listQuery.data ? listQuery.data.page + 1 : 1 })}
              >
                Next page
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
