import { publishGameSettingsAction, saveGameSettingsDraftAction } from '@/app/actions/operations';
import { ConfirmedSubmitButton } from '@/components/confirmed-submit-button';
import { Notice } from '@/components/notice';
import { SubmitButton } from '@/components/submit-button';
import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { hasAdminPermission } from '@/lib/auth/types';
import { DEFAULT_GAME_SETTINGS, loadGameSettingsVersions } from '@/lib/operations';

export const metadata = { title: 'Game settings' };
export const dynamic = 'force-dynamic';

const NOTICE_MESSAGES: Readonly<
  Record<string, { readonly tone: 'success' | 'warning'; readonly text: string }>
> = {
  saved: { tone: 'success', text: 'Settings draft saved.' },
  published: { tone: 'success', text: 'Settings published.' },
  'reason-required': { tone: 'warning', text: 'A reason of 3-500 characters is required.' },
  'invalid-settings': {
    tone: 'warning',
    text: 'One of the values is not valid. Check lengths, URLs, and color formats (#rrggbb).',
  },
  'save-failed': { tone: 'warning', text: 'That change could not be saved.' },
};

const COLOR_SLOTS = 4;

interface SettingsPageProps {
  readonly searchParams: Promise<{ readonly notice?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const context = await requireAuthorizedAdmin('settings.view');
  const notice = NOTICE_MESSAGES[(await searchParams).notice ?? ''];
  const versions = await loadGameSettingsVersions();

  const canUpdate = hasAdminPermission(context, 'settings.update');
  const canPublish = hasAdminPermission(context, 'settings.publish');

  const draft = versions.find((version) => version.lifecycle_status === 'draft');
  const published = versions.find((version) => version.lifecycle_status === 'published');
  const working = draft?.settings ?? published?.settings ?? DEFAULT_GAME_SETTINGS;
  const colorEntries = Object.entries(working.brandColors).slice(0, COLOR_SLOTS);

  return (
    <div className="page-stack">
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      <section className="card" aria-labelledby="settings-current">
        <h2 id="settings-current">Published presentation</h2>
        {published === undefined ? (
          <p className="card__note">
            Nothing has been published yet; the public site uses its built-in defaults. The $FABLE
            access requirement is display-only in Phase 2A — enforcement arrives in Phase 2B.
          </p>
        ) : (
          <dl className="fact-grid">
            <div>
              <dt>Game name</dt>
              <dd>{published.settings.gameName}</dd>
            </div>
            <div>
              <dt>Status label</dt>
              <dd>{published.settings.publicStatusLabel}</dd>
            </div>
            <div>
              <dt>Network</dt>
              <dd>{published.settings.supportedNetworkLabel}</dd>
            </div>
            <div>
              <dt>$FABLE display</dt>
              <dd>{published.settings.fableAccessDisplay}</dd>
            </div>
          </dl>
        )}
      </section>

      {canUpdate ? (
        <section className="card" aria-labelledby="settings-editor">
          <h2 id="settings-editor">
            {draft === undefined ? 'New settings draft' : `Draft v${draft.version_number}`}
          </h2>
          <form className="form-grid" action={saveGameSettingsDraftAction}>
            <div className="field">
              <label htmlFor="settings-game-name">Game name</label>
              <input
                defaultValue={working.gameName}
                id="settings-game-name"
                maxLength={80}
                minLength={2}
                name="gameName"
                required
                type="text"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-status-label">Public status label</label>
              <input
                defaultValue={working.publicStatusLabel}
                id="settings-status-label"
                maxLength={80}
                minLength={2}
                name="publicStatusLabel"
                required
                type="text"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-network">Supported network label</label>
              <input
                defaultValue={working.supportedNetworkLabel}
                id="settings-network"
                maxLength={40}
                minLength={2}
                name="supportedNetworkLabel"
                required
                type="text"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-fable">$FABLE access display (display-only)</label>
              <input
                defaultValue={working.fableAccessDisplay}
                id="settings-fable"
                maxLength={80}
                minLength={2}
                name="fableAccessDisplay"
                required
                type="text"
              />
            </div>
            <div className="field field--wide">
              <label htmlFor="settings-logo">Logo reference (/path or https://)</label>
              <input
                defaultValue={working.logoReference ?? ''}
                id="settings-logo"
                maxLength={500}
                name="logoReference"
                type="text"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-discord">Discord URL (optional)</label>
              <input
                defaultValue={working.discordUrl ?? ''}
                id="settings-discord"
                maxLength={500}
                name="discordUrl"
                placeholder="https://discord.gg/…"
                type="url"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-x">X URL (optional)</label>
              <input
                defaultValue={working.xUrl ?? ''}
                id="settings-x"
                maxLength={500}
                name="xUrl"
                placeholder="https://x.com/…"
                type="url"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-announcements-enabled">Announcements enabled</label>
              <input
                defaultChecked={working.announcementsEnabled}
                id="settings-announcements-enabled"
                name="announcementsEnabled"
                type="checkbox"
              />
            </div>
            <div className="field">
              <label htmlFor="settings-maintenance-banner">Maintenance banner enabled</label>
              <input
                defaultChecked={working.maintenanceBannerEnabled}
                id="settings-maintenance-banner"
                name="maintenanceBannerEnabled"
                type="checkbox"
              />
            </div>

            <fieldset className="field field--wide">
              <legend>Brand colors (optional, name + #rrggbb)</legend>
              <div className="color-grid">
                {Array.from({ length: COLOR_SLOTS }, (_, index) => {
                  const entry = colorEntries[index];
                  return (
                    <div className="color-row" key={index}>
                      <input
                        aria-label={`Color name ${String(index + 1)}`}
                        defaultValue={entry?.[0] ?? ''}
                        maxLength={40}
                        name={`colorName:${String(index)}`}
                        placeholder="primary"
                        type="text"
                      />
                      <input
                        aria-label={`Color value ${String(index + 1)}`}
                        defaultValue={entry?.[1] ?? ''}
                        maxLength={7}
                        name={`colorValue:${String(index)}`}
                        pattern="#[0-9A-Fa-f]{6}"
                        placeholder="#2f5d46"
                        type="text"
                      />
                    </div>
                  );
                })}
              </div>
            </fieldset>

            <div className="field field--wide">
              <label htmlFor="settings-reason">Reason (recorded in the audit log)</label>
              <input
                id="settings-reason"
                maxLength={500}
                minLength={3}
                name="reason"
                required
                type="text"
              />
            </div>
            <div className="field field--actions">
              <SubmitButton pendingLabel="Saving draft…">Save draft</SubmitButton>
            </div>
          </form>

          {draft !== undefined && canPublish ? (
            <form className="publish-bar" action={publishGameSettingsAction}>
              <input name="versionId" type="hidden" value={draft.id} />
              <label>
                Reason
                <input maxLength={500} minLength={3} name="reason" required type="text" />
              </label>
              <ConfirmedSubmitButton
                confirmation="Publish these presentation settings?"
                pendingLabel="Publishing…"
              >
                Publish draft
              </ConfirmedSubmitButton>
            </form>
          ) : null}
        </section>
      ) : null}

      <section className="card card--muted" aria-labelledby="settings-history">
        <h2 id="settings-history">Version history</h2>
        {versions.length === 0 ? (
          <p className="card__note">No versions yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Version</th>
                  <th scope="col">Status</th>
                  <th scope="col">Game name</th>
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
                    <td>{version.settings.gameName}</td>
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
