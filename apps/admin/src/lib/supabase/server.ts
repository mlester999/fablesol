import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import { getAdminPublicEnv, requireAdminEnv } from '../env';
import { adminAuthCookieOptions } from './cookie-options';

/** Creates one request-scoped Supabase client backed by Next's cookie store. */
export async function createAdminServerClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseAnonKey } = requireAdminEnv();
  const { adminUrl } = getAdminPublicEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot mutate cookies; server actions and route
          // handlers refresh them before rendering.
        }
      },
    },
    cookieOptions: adminAuthCookieOptions(adminUrl),
  });
}
