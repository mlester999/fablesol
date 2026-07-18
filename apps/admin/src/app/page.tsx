import { redirect } from 'next/navigation';

import { getCurrentAdminAuthorization } from '@/lib/auth/authorization';
import { destinationForAuthorization } from '@/lib/auth/redirects';
import { isAdminSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  if (!isAdminSupabaseConfigured()) {
    return (
      <main className="auth-shell auth-shell--single">
        <section className="auth-panel" aria-labelledby="auth-title">
          <div className="auth-panel__inner">
            <p className="eyebrow">Setup required</p>
            <h1 id="auth-title">Supabase is not configured</h1>
            <p className="lede">
              Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to
              apps/admin/.env.local, then restart the admin portal.
            </p>
          </div>
        </section>
      </main>
    );
  }

  const authorization = await getCurrentAdminAuthorization();
  redirect(destinationForAuthorization(authorization));
}
