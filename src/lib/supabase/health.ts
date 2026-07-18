import 'server-only';

import { getPublicEnv } from '@/lib/env';

export interface SupabaseHealthResult {
  readonly configured: boolean;
  readonly ok: boolean;
  readonly latencyMs?: number;
  readonly error?: string;
}

/**
 * Internal connection diagnostic against the hosted Supabase project's
 * public health endpoint. Uses only the anon key, never runs in the
 * browser, and is not exposed on any public page.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    return { configured: false, ok: false, error: 'Supabase environment is not configured.' };
  }
  const started = Date.now();
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabaseAnonKey },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - started;
    if (!response.ok) {
      return { configured: true, ok: false, latencyMs, error: `HTTP ${response.status}` };
    }
    return { configured: true, ok: true, latencyMs };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
