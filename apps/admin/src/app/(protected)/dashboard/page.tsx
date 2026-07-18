import Link from 'next/link';

import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { hasAdminPermission } from '@/lib/auth/types';
import { getAdminPublicEnv } from '@/lib/env';
import { resolveAdminNavigation } from '@/lib/navigation';
import { createAdminServerClient } from '@/lib/supabase/server';

export const metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

interface PlatformStatus {
  readonly authHealthy: boolean | undefined;
  readonly maintenanceActive: boolean | undefined;
  readonly activeAnnouncements: number | undefined;
}

async function loadPlatformStatus(canViewHealth: boolean): Promise<PlatformStatus> {
  let authHealthy: boolean | undefined;

  if (canViewHealth) {
    const { supabaseUrl, supabaseAnonKey } = getAdminPublicEnv();
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
          headers: { apikey: supabaseAnonKey },
          cache: 'no-store',
          signal: AbortSignal.timeout(4000),
        });
        authHealthy = response.ok;
      } catch {
        authHealthy = false;
      }
    }
  }

  let maintenanceActive: boolean | undefined;
  let activeAnnouncements: number | undefined;

  try {
    const supabase = await createAdminServerClient();
    const [maintenanceResult, announcementsResult] = await Promise.all([
      supabase.rpc('get_public_maintenance'),
      supabase.rpc('get_public_announcements'),
    ]);

    if (!maintenanceResult.error && typeof maintenanceResult.data === 'object') {
      maintenanceActive = Reflect.get(maintenanceResult.data as object, 'active') === true;
    }
    if (!announcementsResult.error && Array.isArray(announcementsResult.data)) {
      activeAnnouncements = announcementsResult.data.length;
    }
  } catch {
    // Status tiles degrade to "unknown"; the dashboard must never crash.
  }

  return { authHealthy, maintenanceActive, activeAnnouncements };
}

function statusLabel(value: boolean | undefined, whenTrue: string, whenFalse: string): string {
  if (value === undefined) return 'Unknown';
  return value ? whenTrue : whenFalse;
}

export default async function DashboardPage() {
  const context = await requireAuthorizedAdmin('dashboard.view');
  const navigation = resolveAdminNavigation(context);
  const canViewHealth = hasAdminPermission(context, 'system.health.view');
  const status = await loadPlatformStatus(canViewHealth);
  const modules = navigation.filter((item) => item.href !== '/dashboard');

  return (
    <div className="page-stack">
      <section className="card" aria-labelledby="dashboard-identity">
        <h2 id="dashboard-identity">Your access</h2>
        <dl className="fact-grid">
          <div>
            <dt>Administrator</dt>
            <dd>{context.fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{context.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{context.roleName}</dd>
          </div>
          <div>
            <dt>Permissions</dt>
            <dd>{context.permissionKeys.length} granted</dd>
          </div>
        </dl>
        <p className="card__note">
          Access is re-evaluated from trusted database records on every request. Role changes and
          suspensions apply immediately.
        </p>
      </section>

      <section className="card" aria-labelledby="dashboard-status">
        <h2 id="dashboard-status">Platform status</h2>
        <dl className="fact-grid">
          {canViewHealth ? (
            <div>
              <dt>Supabase auth service</dt>
              <dd data-tone={status.authHealthy === false ? 'danger' : undefined}>
                {statusLabel(status.authHealthy, 'Healthy', 'Unreachable')}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>Maintenance mode</dt>
            <dd data-tone={status.maintenanceActive === true ? 'warning' : undefined}>
              {statusLabel(status.maintenanceActive, 'Active', 'Off')}
            </dd>
          </div>
          <div>
            <dt>Active announcements</dt>
            <dd>{status.activeAnnouncements ?? 'Unknown'}</dd>
          </div>
        </dl>
        <p className="card__note">
          Public-facing values come from the same fail-safe functions the public site uses; drafts
          are never counted.
        </p>
      </section>

      <section className="card" aria-labelledby="dashboard-modules">
        <h2 id="dashboard-modules">Your modules</h2>
        {modules.length === 0 ? (
          <p className="card__note">Your role has no additional modules.</p>
        ) : (
          <ul className="module-grid">
            {modules.map((item) => (
              <li key={item.href}>
                <Link className="module-tile" href={item.href}>
                  <strong>{item.label}</strong>
                  <span>{item.group}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card card--muted" aria-labelledby="dashboard-phase">
        <h2 id="dashboard-phase">Phase 2A scope</h2>
        <p className="card__note">
          This console covers team administration, announcements, maintenance, feature availability,
          game settings, and the audit log. Player systems and wallet access arrive in Phase 2B and
          are intentionally absent here.
        </p>
      </section>
    </div>
  );
}
