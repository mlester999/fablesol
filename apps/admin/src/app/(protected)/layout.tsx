import type { ReactNode } from 'react';

import { logoutAction } from '@/app/actions/auth';
import { AdminAppShell } from '@/components/app-shell';
import { SubmitButton } from '@/components/submit-button';
import { requireAuthorizedAdmin } from '@/lib/auth/authorization';
import { getAdminPublicEnv } from '@/lib/env';
import { resolveAdminNavigation } from '@/lib/navigation';

interface ProtectedLayoutProps {
  readonly children: ReactNode;
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const context = await requireAuthorizedAdmin();
  const navigation = resolveAdminNavigation(context);
  const { environmentLabel } = getAdminPublicEnv();

  const signOut = (
    <form action={logoutAction}>
      <SubmitButton variant="quiet" pendingLabel="Signing out…">
        Sign out
      </SubmitButton>
    </form>
  );

  return (
    <AdminAppShell
      displayName={context.fullName}
      environmentLabel={environmentLabel ?? null}
      items={navigation}
      roleName={context.roleName}
      signOut={signOut}
    >
      {children}
    </AdminAppShell>
  );
}
