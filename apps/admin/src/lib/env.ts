/**
 * Admin environment access — the single place that reads process.env.
 *
 * The admin portal is an operations console: unlike the public site it does
 * not silently degrade when Supabase is missing. Server code calls
 * `requireAdminEnv()` and receives a clear, non-secret error instead of a
 * half-working portal.
 */

export interface AdminPublicEnv {
  readonly supabaseUrl: string | undefined;
  readonly supabaseAnonKey: string | undefined;
  readonly adminUrl: string;
  readonly environmentLabel: string | undefined;
}

export interface AdminServerEnv {
  /** Privileged key — server only, never expose or log. */
  readonly supabaseServiceRoleKey: string | undefined;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function validUrl(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return undefined;
    return value;
  } catch {
    return undefined;
  }
}

export function getAdminPublicEnv(): AdminPublicEnv {
  return {
    supabaseUrl: validUrl(clean(process.env.NEXT_PUBLIC_SUPABASE_URL)),
    supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    adminUrl: validUrl(clean(process.env.NEXT_PUBLIC_ADMIN_URL)) ?? 'http://localhost:3601',
    environmentLabel: clean(process.env.NEXT_PUBLIC_ADMIN_ENV_LABEL),
  };
}

export function getAdminServerEnv(): AdminServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getAdminServerEnv() must never run in the browser.');
  }
  return {
    supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

export function isAdminSupabaseConfigured(): boolean {
  const env = getAdminPublicEnv();
  return env.supabaseUrl !== undefined && env.supabaseAnonKey !== undefined;
}

/** Returns the Supabase URL and anon key or throws a clear, non-secret error. */
export function requireAdminEnv(): {
  readonly supabaseUrl: string;
  readonly supabaseAnonKey: string;
} {
  const { supabaseUrl, supabaseAnonKey } = getAdminPublicEnv();
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'The admin portal requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Link the root env file once: ln -s ../../.env.local apps/admin/.env.local',
    );
  }
  return { supabaseUrl, supabaseAnonKey };
}
