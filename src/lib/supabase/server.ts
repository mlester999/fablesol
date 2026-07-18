import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv, getServerEnv } from '@/lib/env';

/**
 * Server Supabase client bound to the request cookie store (anon key).
 * Use inside Server Components, Route Handlers, and Server Actions.
 * Returns undefined when Supabase is not configured.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | undefined> {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) return undefined;
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
          // Called from a Server Component where cookies are read-only;
          // middleware-based refresh can take over in a later phase.
        }
      },
    },
  });
}

/**
 * Privileged service-role client for trusted server-side jobs only.
 * Never import from client code; 'server-only' enforces this at build time.
 */
export function getSupabaseServiceRoleClient(): SupabaseClient | undefined {
  const { supabaseUrl } = getPublicEnv();
  const { supabaseServiceRoleKey } = getServerEnv();
  if (!supabaseUrl || !supabaseServiceRoleKey) return undefined;
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
