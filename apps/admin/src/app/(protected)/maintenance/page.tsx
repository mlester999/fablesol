import { publishMaintenanceAction, saveMaintenanceDraftAction } from '@/app/actions/operations';
import { ConfirmedSubmitButton } from '@/components/confirmed-submit-button';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { hasAdminPermission } from '@/lib/auth/types';
import { toDatetimeLocal } from '@/lib/datetime';
import { loadMaintenanceVersions } from '@/lib/operations';

export const metadata = { title: 'Maintenance' };
export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Readonly<
  Record<string, { readonly tone: 'success' | 'warning'; readonly text: string }>
> = {
  saved: { tone: 'success', text: 'Maintenance draft saved.' },
  published: { tone: 'success', text: 'Maintenance configuration published.' },
  'missing-fields': { tone: 'warning', text: 'A title and short message are required.' },
  'reason-required': { tone: 'warning', text: 'A reason of 3-500 characters is required.' },
  'save-failed': { tone: 'warning', text: 'That change could not be saved.' },
};

interface MaintenancePageProps {
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export default async function MaintenancePage({ searchParams }: MaintenancePageProps) {
  const context = await requireAuthorizedAdmin('maintenance.view');
  const notice = NOTICE_MESSAGES[(await searchParams).notice ?? ''];
  const versions = await loadMaintenanceVersions();

  const canManage = hasAdminPermission(context, 'maintenance.manage');
  const canPublish = hasAdminPermission(context, 'maintenance.publish');

  const draft = versions.find((version) => version.lifecycle_status === 'draft');
  const published = versions.find((version) => version.lifecycle_status === 'published');
  const editorSource = draft ?? published;

  return (
    <div className="page-stack">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <section className="card" aria-labelledby="maintenance-current">
        <h2 id="maintenance-current">Current public state</h2>
        {published === undefined ? (
          <p className="card__note">
            No maintenance configuration has been published. The public site treats maintenance as
            off.
          </p>
        ) : (
          <dl className="fact-grid">
            <div>
              <dt>Maintenance mode</dt>
              <dd data-tone={published.enabled ? 'warning' : undefined}>
                {published.enabled ? 'Enabled' : 'Off'}
              </dd>
            </div>
            <div>
              <dt>Published version</dt>
              <dd>v{published.version_number}</dd>
            </div>
            <div>
              <dt>Title</dt>
              <dd>{published.title}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>
                {published.starts_at === null
                  ? 'Immediate'
                  : new Date(published.starts_at).toLocaleString()}
                {published.expected_end_at === null
                  ? ''
                  : ` → ${new Date(published.expected_end_at).toLocaleString()}`}
              </dd>
            </div>
          </dl>
        )}
      </section>

      {canManage ? (
        <section className="card" aria-labelledby="maintenance-draft">
          <h2 id="maintenance-draft">
            {draft === undefined ? 'New draft' : `Draft v${draft.version_number}`}
          </h2>
          <p className="card__note">
            Saving updates the single working draft; publishing supersedes the current published
            version. Nothing here affects players until published.
          </p>
          <form className="form-grid" action={saveMaintenanceDraftAction}>
            <div className="field">
              <label htmlFor="maintenance-enabled">Maintenance enabled when published</label>
              <input
                defaultChecked={editorSource?.enabled ?? false}
                id="maintenance-enabled"
                name="enabled"
                type="checkbox"
              />
            </div>
            <div className="field">
              <label htmlFor="maintenance-title">Title</label>
              <input
                defaultValue={editorSource?.title ?? 'Scheduled maintenance'}
                id="maintenance-title"
                maxLength={80}
                name="title"
                required
                type="text"
              />
            </div>
            <div className="field field--wide">
              <label htmlFor="maintenance-short">Short message</label>
              <input
                defaultValue={
                  editorSource?.short_message ??
                  'Fablesol is temporarily unavailable for maintenance.'
                }
                id="maintenance-short"
                maxLength={240}
                name="shortMessage"
                required
                type="text"
              />
            </div>
            <div className="field field--wide">
              <label htmlFor="maintenance-detail">Detail message (optional)</label>
              <textarea
                defaultValue={editorSource?.detail_message ?? ''}
                id="maintenance-detail"
                maxLength={2000}
                name="detailMessage"
                rows={3}
              />
            </div>
            <div className="field">
              <label htmlFor="maintenance-starts">Starts at (optional)</label>
              <input
                defaultValue={toDatetimeLocal(editorSource?.starts_at ?? null)}
                id="maintenance-starts"
                name="startsAt"
                type="datetime-local"
              />
            </div>
            <div className="field">
              <label htmlFor="maintenance-ends">Expected end (optional)</label>
              <input
                defaultValue={toDatetimeLocal(editorSource?.expected_end_at ?? null)}
                id="maintenance-ends"
                name="expectedEndAt"
                type="datetime-local"
              />
            </div>
            <div className="field field--actions">
              <SubmitButton pendingLabel="Saving draft…">Save draft</SubmitButton>
            </div>
          </form>

          {draft !== undefined && canPublish ? (
            <form className="publish-bar" action={publishMaintenanceAction}>
              <input name="versionId" type="hidden" value={draft.id} />
              <label>
                Reason
                <input maxLength={500} minLength={3} name="reason" required type="text" />
              </label>
              <ConfirmedSubmitButton
                confirmation={
                  draft.enabled
                    ? 'Publish and ENABLE maintenance mode for all players?'
                    : 'Publish this maintenance configuration?'
                }
                pendingLabel="Publishing…"
                variant={draft.enabled ? 'danger' : 'primary'}
              >
                {draft.enabled ? 'Publish and enable maintenance' : 'Publish draft'}
              </ConfirmedSubmitButton>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="card card--muted" aria-labelledby="maintenance-history">
        <h2 id="maintenance-history">Version history</h2>
        {versions.length === 0 ? (
          <p className="card__note">No versions yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Status</th>
                  <th scope="col">Enabled</th>
                  <th scope="col">Title</th>
                  <th scope="col">Published</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id}>
                    <td>v{version.version_number}</td>
                    <td>
                      <span className={`status-pill status-pill--${version.lifecycle_status}`}>
                        {version.lifecycle_status}
                      </span>
                    </td>
                    <td>{version.enabled ? 'Yes' : 'No'}</td>
                    <td>{version.title}</td>
                    <td>
                      {version.published_at === null
                        ? '—'
                        : new Date(version.published_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
