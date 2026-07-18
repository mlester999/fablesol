'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getAdminPublicEnv, requireAdminEnv } from '../env';
import { adminAuthCookieOptions } from './cookie-options';

let browserClient: SupabaseClient | undefined;

/**
 * Cookie-backed browser client for interactive flows. Privileged credentials
 * are intentionally not accepted by this boundary.
 */
export function createAdminBrowserClient(): SupabaseClient {
  const { supabaseUrl, supabaseAnonKey } = requireAdminEnv();
  const { adminUrl } = getAdminPublicEnv();

  browserClient ??= createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: adminAuthCookieOptions(adminUrl),
  });
  return browserClient;
}
