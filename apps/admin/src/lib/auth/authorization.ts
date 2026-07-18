import 'server-only';

import { redirect } from 'next/navigation';
import { cache } from 'react';

import { createAdminServerClient } from '../supabase/server';
import { destinationForAuthorization } from './redirects';
import {
  adminAuthorizationResultSchema,
  hasAdminPermission,
  isAuthorizedAdmin,
  type AdminAuthorizationContext,
  type AdminAuthorizationResult,
} from './types';
import type { AdminPermissionKey } from './catalog';

const UNAUTHENTICATED_RESULT = {
  outcome: 'unauthenticated',
} as const satisfies AdminAuthorizationResult;

export class AdminAuthorizationUnavailableError extends Error {
  public constructor() {
    super('Administrator authorization is temporarily unavailable.');
    this.name = 'AdminAuthorizationUnavailableError';
  }
}

async function loadCurrentAdminAuthorization(): Promise<AdminAuthorizationResult> {
  const supabase = await createAdminServerClient();
  const claimsResult = await supabase.auth.getClaims();

  if (claimsResult.error || !claimsResult.data?.claims.sub) {
    return UNAUTHENTICATED_RESULT;
  }

  const userResult = await supabase.auth.getUser();

  if (userResult.error || userResult.data.user.id !== claimsResult.data.claims.sub) {
    return UNAUTHENTICATED_RESULT;
  }

  // Membership is re-evaluated on every request: suspensions and role changes
  // take effect on the next request without stale client state.
  const rpcResult = await supabase.rpc('get_current_admin_context');

  if (rpcResult.error) {
    throw new AdminAuthorizationUnavailableError();
  }

  const parsed = adminAuthorizationResultSchema.safeParse(rpcResult.data);

  if (!parsed.success) {
    throw new AdminAuthorizationUnavailableError();
  }

  return parsed.data;
}

/** Cached only within one React server render so layouts and pages share one trusted RPC result. */
export const getCurrentAdminAuthorization = cache(loadCurrentAdminAuthorization);

export async function requireAuthorizedAdmin(
  permissionKey?: AdminPermissionKey,
): Promise<AdminAuthorizationContext> {
  const result = await getCurrentAdminAuthorization();

  if (!isAuthorizedAdmin(result)) {
    redirect(destinationForAuthorization(result));
  }

  if (permissionKey !== undefined && !hasAdminPermission(result.context, permissionKey)) {
    redirect('/unauthorized');
  }

  return result.context;
}
