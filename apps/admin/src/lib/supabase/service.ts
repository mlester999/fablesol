import 'server-only';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getAdminServerEnv, requireAdminEnv } from '../env';

/**
 * Privileged service-role client for trusted server-side operations only
 * (invitation auth-user provisioning). Returns undefined when the key is not
 * configured so callers can degrade with an honest message instead of a 500.
 */
export function createAdminServiceRoleClient(): SupabaseClient | undefined {
  const { supabaseUrl } = requireAdminEnv();
  const { supabaseServiceRoleKey } = getAdminServerEnv();
  if (!supabaseServiceRoleKey) return undefined;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
