import {
  publishFeatureAvailabilityAction,
  saveFeatureAvailabilityDraftAction,
} from '@/app/actions/operations';
import { ConfirmedSubmitButton } from '@/components/confirmed-submit-button';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { hasAdminPermission } from '@/lib/auth/types';
import {
  FEATURE_OVERRIDE_STATUSES,
  loadFeatureAvailabilityVersions,
  loadFeatureKeys,
} from '@/lib/operations';

export const metadata = { title: 'Feature availability' };
export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Readonly<
  Record<string, { readonly tone: 'success' | 'warning'; readonly text: string }>
> = {
  saved: { tone: 'success', text: 'Feature availability draft saved.' },
  published: { tone: 'success', text: 'Feature availability published.' },
  'reason-required': { tone: 'warning', text: 'A reason of 3-500 characters is required.' },
  'invalid-overrides': { tone: 'warning', text: 'One of the overrides is not valid.' },
  'save-failed': { tone: 'warning', text: 'That change could not be saved.' },
};

interface FeaturesPageProps {
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export default async function FeaturesPage({ searchParams }: FeaturesPageProps) {
  const context = await requireAuthorizedAdmin('features.view');
  const notice = NOTICE_MESSAGES[(await searchParams).notice ?? ''];
  const [featureKeys, versions] = await Promise.all([
    loadFeatureKeys(),
    loadFeatureAvailabilityVersions(),
  ]);

  const canUpdate = hasAdminPermission(context, 'features.update');
  const canPublish = hasAdminPermission(context, 'features.publish');

  const draft = versions.find((version) => version.lifecycle_status === 'draft');
  const published = versions.find((version) => version.lifecycle_status === 'published');
  const workingOverrides = draft?.overrides ?? published?.overrides ?? {};

  return (
    <div className="page-stack">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <section className="card" aria-labelledby="features-overview">
        <h2 id="features-overview">How this works</h2>
        <p className="card__note">
          The typed registry in the public repository is the source of truth. Published overrides
          adjust the status players see; the public site always falls back to the registry when no
          override is published. &ldquo;Registry default&rdquo; removes the override for that
          feature.
        </p>
        <dl className="fact-grid">
          <div>
            <dt>Registered features</dt>
            <dd>{featureKeys.length}</dd>
          </div>
          <div>
            <dt>Published overrides</dt>
            <dd>{published === undefined ? 'None' : Object.keys(published.overrides).length}</dd>
          </div>
          <div>
            <dt>Draft overrides</dt>
            <dd>{draft === undefined ? 'No draft' : Object.keys(draft.overrides).length}</dd>
          </div>
        </dl>
      </section>

      {canUpdate ? (
        <section className="card" aria-labelledby="features-editor">
          <h2 id="features-editor">
            {draft === undefined ? 'New overrides draft' : `Draft v${draft.version_number}`}
          </h2>
          <form action={saveFeatureAvailabilityDraftAction}>
            <div className="table-scroll">
              <table className="data-table data-table--editor">
                <thead>
                  <tr>
                    <th scope="col">Feature</th>
                    <th scope="col">Override status</th>
                    <th scope="col">Note (optional, shown to players)</th>
                  </tr>
                </thead>
                <tbody>
                  {featureKeys.map((feature) => {
                    const override = workingOverrides[feature.key];
                    return (
                      <tr key={feature.key}>
                        <td>
                          <strong>{feature.name}</strong>
                          <span className="table-sub">{feature.key}</span>
                          <input name="featureKey" type="hidden" value={feature.key} />
                        </td>
                        <td>
                          <select
                            aria-label={`Override status for ${feature.name}`}
                            defaultValue={override?.status ?? 'registry'}
                            name={`status:${feature.key}`}
                          >
                            <option value="registry">Registry default</option>
                            {FEATURE_OVERRIDE_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            aria-label={`Note for ${feature.name}`}
                            defaultValue={override?.note ?? ''}
                            maxLength={200}
                            name={`note:${feature.key}`}
                            type="text"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="publish-bar">
              <label>
                Reason
                <input maxLength={500} minLength={3} name="reason" required type="text" />
              </label>
              <SubmitButton pendingLabel="Saving draft…">Save draft</SubmitButton>
            </div>
          </form>

          {draft !== undefined && canPublish ? (
            <form className="publish-bar" action={publishFeatureAvailabilityAction}>
              <input name="versionId" type="hidden" value={draft.id} />
              <label>
                Reason
                <input maxLength={500} minLength={3} name="reason" required type="text" />
              </label>
              <ConfirmedSubmitButton
                confirmation="Publish these availability overrides for all players?"
                pendingLabel="Publishing…"
              >
                Publish draft
              </ConfirmedSubmitButton>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="card card--muted" aria-labelledby="features-history">
        <h2 id="features-history">Version history</h2>
        {versions.length === 0 ? (
          <p className="card__note">No versions yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Status</th>
                  <th scope="col">Overrides</th>
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
                    <td>{Object.keys(version.overrides).length}</td>
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
