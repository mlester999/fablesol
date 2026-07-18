import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { AUDIT_TARGET_TYPES, loadAuditEntries } from '@/lib/operations';

export const metadata = { title: 'Audit log' };
export const dynamic = 'force-dynamic';

const EVENT_PREFIXES = [
  { value: '', label: 'All events' },
  { value: 'admin.', label: 'Team and invitations' },
  { value: 'announcement.', label: 'Announcements' },
  { value: 'maintenance.', label: 'Maintenance' },
  { value: 'features.', label: 'Feature availability' },
  { value: 'settings.', label: 'Game settings' },
] as const;

interface AuditPageProps {
  readonly searchParams: Promise<{
    readonly event?: string;
    readonly target?: string;
    readonly limit?: string;
  }>;
}

function formatState(state: Record<string, unknown>): string | undefined {
  if (Object.keys(state).length === 0) return undefined;
  return JSON.stringify(state, null, 2);
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  await requireAuthorizedAdmin('audit.view');
  const parameters = await searchParams;

  const eventPrefix = EVENT_PREFIXES.some((option) => option.value === parameters.event)
    ? parameters.event
    : undefined;
  const targetType = (AUDIT_TARGET_TYPES as readonly string[]).includes(parameters.target ?? '')
    ? (parameters.target as (typeof AUDIT_TARGET_TYPES)[number])
    : undefined;
  const limit = Number.parseInt(parameters.limit ?? '100', 10);

  const entries = await loadAuditEntries({
    eventPrefix: eventPrefix === '' ? undefined : eventPrefix,
    targetType,
    limit: Number.isInteger(limit) ? limit : 100,
  });

  return (
    <div className="page-stack">
      <section className="card" aria-labelledby="audit-filters">
        <h2 id="audit-filters">Filters</h2>
        <form className="filter-bar" method="get">
          <label>
            Event group
            <select defaultValue={eventPrefix ?? ''} name="event">
              {EVENT_PREFIXES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Target type
            <select defaultValue={targetType ?? ''} name="target">
              <option value="">All targets</option>
              {AUDIT_TARGET_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <label>
            Entries
            <select defaultValue={String(limit)} name="limit">
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </label>
          <button className="button button--secondary" type="submit">
            Apply filters
          </button>
        </form>
        <p className="card__note">
          The audit log is append-only: entries can never be edited or deleted, including by Super
          Admins.
        </p>
      </section>

      <section className="card" aria-labelledby="audit-entries">
        <h2 id="audit-entries">Entries ({entries.length})</h2>
        {entries.length === 0 ? (
          <p className="card__note">No audit entries match these filters.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Event</th>
                  <th scope="col">Target</th>
                  <th scope="col">Outcome</th>
                  <th scope="col">Reason</th>
                  <th scope="col">Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const before = formatState(entry.before_state);
                  const after = formatState(entry.after_state);
                  const metadata = formatState(entry.metadata);
                  const hasDetail =
                    before !== undefined || after !== undefined || metadata !== undefined;
                  return (
                    <tr key={entry.id}>
                      <td>{new Date(entry.created_at).toLocaleString()}</td>
                      <td>
                        <code>{entry.event_key}</code>
                      </td>
                      <td>
                        {entry.target_type === null
                          ? '—'
                          : `${entry.target_type.replaceAll('_', ' ')}`}
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${entry.outcome}`}>
                          {entry.outcome}
                        </span>
                      </td>
                      <td>{entry.reason ?? '—'}</td>
                      <td>
                        {hasDetail ? (
                          <details className="audit-detail">
                            <summary>View</summary>
                            {before !== undefined ? (
                              <div>
                                <h3>Before</h3>
                                <pre>{before}</pre>
                              </div>
                            ) : null}
                            {after !== undefined ? (
                              <div>
                                <h3>After</h3>
                                <pre>{after}</pre>
                              </div>
                            ) : null}
                            {metadata !== undefined ? (
                              <div>
                                <h3>Metadata</h3>
                                <pre>{metadata}</pre>
                              </div>
                            ) : null}
                          </details>
                        ) : (
                          '—'
                        )}
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
