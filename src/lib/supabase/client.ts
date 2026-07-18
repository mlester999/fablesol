'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getPublicEnv } from '@/lib/env';

let browserClient: SupabaseClient | undefined;

/**
 * Shared browser Supabase client (anon key only — safe for the bundle).
 * Returns undefined when the project is not configured so public pages
 * keep working without any Supabase environment at all.
 */
export function getSupabaseBrowserClient(): SupabaseClient | undefined {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) return undefined;
  browserClient ??= createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
