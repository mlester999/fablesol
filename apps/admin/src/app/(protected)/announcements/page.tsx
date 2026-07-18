import Link from 'next/link';

import {
  cancelAnnouncementAction,
  publishAnnouncementAction,
  saveAnnouncementAction,
} from '@/app/actions/operations';
import { ConfirmedSubmitButton } from '@/components/confirmed-submit-button';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { hasAdminPermission } from '@/lib/auth/types';
import { toDatetimeLocal } from '@/lib/datetime';
import {
  ANNOUNCEMENT_SEVERITIES,
  announcementEffectiveStatus,
  loadAnnouncements,
} from '@/lib/operations';

export const metadata = { title: 'Announcements' };
export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Readonly<
  Record<string, { readonly tone: 'success' | 'warning'; readonly text: string }>
> = {
  created: { tone: 'success', text: 'Draft created.' },
  saved: { tone: 'success', text: 'Draft saved.' },
  published: { tone: 'success', text: 'Announcement published.' },
  cancelled: { tone: 'success', text: 'Announcement cancelled.' },
  'missing-fields': { tone: 'warning', text: 'A title and message are required.' },
  'cta-pair': { tone: 'warning', text: 'A call to action needs both a label and a URL.' },
  'reason-required': { tone: 'warning', text: 'A reason of 3-500 characters is required.' },
  'version-conflict': {
    tone: 'warning',
    text: 'Someone else changed this announcement first. Review the latest state and try again.',
  },
  'save-failed': { tone: 'warning', text: 'That change could not be saved.' },
};

interface AnnouncementsPageProps {
  readonly searchParams: Promise<{ readonly notice?: string; readonly edit?: string }>;
}

export default async function AnnouncementsPage({ searchParams }: AnnouncementsPageProps) {
  const context = await requireAuthorizedAdmin('announcements.view');
  const parameters = await searchParams;
  const notice = NOTICE_MESSAGES[parameters.notice ?? ''];
  const announcements = await loadAnnouncements();

  const canCreate = hasAdminPermission(context, 'announcements.create');
  const canUpdate = hasAdminPermission(context, 'announcements.update');
  const canPublish = hasAdminPermission(context, 'announcements.publish');
  const canCancel = hasAdminPermission(context, 'announcements.cancel');

  const editing =
    parameters.edit === undefined
      ? undefined
      : announcements.find(
          (item) => item.id === parameters.edit && item.lifecycle_status === 'draft',
        );
  const showEditor = editing !== undefined ? canUpdate : canCreate;

  return (
    <div className="page-stack">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {showEditor ? (
        <section className="card" aria-labelledby="announcement-editor">
          <h2 id="announcement-editor">
            {editing === undefined ? 'New announcement draft' : `Edit draft: ${editing.title}`}
          </h2>
          <p className="card__note">
            Drafts are invisible to players until published. Times are entered in the server
            timezone and stored in UTC.
          </p>
          <form className="form-grid" action={saveAnnouncementAction}>
            {editing === undefined ? null : (
              <>
                <input name="id" type="hidden" value={editing.id} />
                <input name="expectedRevision" type="hidden" value={editing.revision} />
              </>
            )}
            <div className="field field--wide">
              <label htmlFor="announcement-title">Title (internal)</label>
              <input
                defaultValue={editing?.title ?? ''}
                id="announcement-title"
                maxLength={100}
                name="title"
                required
                type="text"
              />
            </div>
            <div className="field field--wide">
              <label htmlFor="announcement-message">Message (shown to players)</label>
              <textarea
                defaultValue={editing?.message ?? ''}
                id="announcement-message"
                maxLength={500}
                name="message"
                required
                rows={3}
              />
            </div>
            <div className="field">
              <label htmlFor="announcement-severity">Severity</label>
              <select
                defaultValue={editing?.severity ?? 'information'}
                id="announcement-severity"
                name="severity"
              >
                {ANNOUNCEMENT_SEVERITIES.map((severity) => (
                  <option key={severity} value={severity}>
                    {severity}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="announcement-dismissible">Dismissible</label>
              <input
                defaultChecked={editing?.dismissible ?? true}
                id="announcement-dismissible"
                name="dismissible"
                type="checkbox"
              />
            </div>
            <div className="field">
              <label htmlFor="announcement-starts">Starts at (optional)</label>
              <input
                defaultValue={toDatetimeLocal(editing?.starts_at ?? null)}
                id="announcement-starts"
                name="startsAt"
                type="datetime-local"
              />
            </div>
            <div className="field">
              <label htmlFor="announcement-ends">Ends at (optional)</label>
              <input
                defaultValue={toDatetimeLocal(editing?.ends_at ?? null)}
                id="announcement-ends"
                name="endsAt"
                type="datetime-local"
              />
            </div>
            <div className="field">
              <label htmlFor="announcement-cta-label">CTA label (optional)</label>
              <input
                defaultValue={editing?.cta_label ?? ''}
                id="announcement-cta-label"
                maxLength={40}
                name="ctaLabel"
                type="text"
              />
            </div>
            <div className="field">
              <label htmlFor="announcement-cta-url">CTA URL (/path or https://)</label>
              <input
                defaultValue={editing?.cta_url ?? ''}
                id="announcement-cta-url"
                maxLength={500}
                name="ctaUrl"
                type="text"
              />
            </div>
            <div className="field field--actions">
              <SubmitButton pendingLabel="Saving…">
                {editing === undefined ? 'Create draft' : 'Save draft'}
              </SubmitButton>
              {editing === undefined ? null : (
                <Link className="button button--quiet" href="/announcements">
                  Stop editing
                </Link>
              )}
            </div>
          </form>
        </section>
      ) : null}

      <section className="card" aria-labelledby="announcement-list">
        <h2 id="announcement-list">Announcements ({announcements.length})</h2>
        {announcements.length === 0 ? (
          <p className="card__note">No announcements yet. Drafts appear here before publishing.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Announcement</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Status</th>
                  <th scope="col">Window</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((announcement) => {
                  const effective = announcementEffectiveStatus(announcement);
                  return (
                    <tr key={announcement.id}>
                      <td>
                        <strong>{announcement.title}</strong>
                        <span className="table-sub">{announcement.message}</span>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${announcement.severity}`}>
                          {announcement.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${effective}`}>{effective}</span>
                        <span className="table-sub">rev {announcement.revision}</span>
                      </td>
                      <td>
                        {announcement.starts_at === null
                          ? 'Immediately'
                          : new Date(announcement.starts_at).toLocaleString()}
                        {announcement.ends_at === null
                          ? ''
                          : ` → ${new Date(announcement.ends_at).toLocaleString()}`}
                      </td>
                      <td>
                        <div className="table-actions">
                          {announcement.lifecycle_status === 'draft' && canUpdate ? (
                            <Link
                              className="button button--quiet"
                              href={`/announcements?edit=${announcement.id}`}
                            >
                              Edit
                            </Link>
                          ) : null}
                          {announcement.lifecycle_status === 'draft' && canPublish ? (
                            <details className="row-actions">
                              <summary>Publish</summary>
                              <form
                                className="row-actions__form"
                                action={publishAnnouncementAction}
                              >
                                <input name="id" type="hidden" value={announcement.id} />
                                <input
                                  name="expectedRevision"
                                  type="hidden"
                                  value={announcement.revision}
                                />
                                <label>
                                  Reason
                                  <input
                                    maxLength={500}
                                    minLength={3}
                                    name="reason"
                                    required
                                    type="text"
                                  />
                                </label>
                                <ConfirmedSubmitButton
                                  confirmation="Publish this announcement to all players?"
                                  pendingLabel="Publishing…"
                                >
                                  Publish now
                                </ConfirmedSubmitButton>
                              </form>
                            </details>
                          ) : null}
                          {announcement.lifecycle_status === 'published' && canCancel ? (
                            <details className="row-actions">
                              <summary>Cancel</summary>
                              <form className="row-actions__form" action={cancelAnnouncementAction}>
                                <input name="id" type="hidden" value={announcement.id} />
                                <input
                                  name="expectedRevision"
                                  type="hidden"
                                  value={announcement.revision}
                                />
                                <label>
                                  Reason
                                  <input
                                    maxLength={500}
                                    minLength={3}
                                    name="reason"
                                    required
                                    type="text"
                                  />
                                </label>
                                <ConfirmedSubmitButton
                                  confirmation="Cancel this announcement? It disappears for players immediately."
                                  pendingLabel="Cancelling…"
                                  variant="danger"
                                >
                                  Cancel announcement
                                </ConfirmedSubmitButton>
                              </form>
                            </details>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
