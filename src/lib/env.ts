/**
 * Environment validation — the single place that reads process.env.
 *
 * Public (NEXT_PUBLIC_*) values are safe for the browser bundle. Server-only
 * values must never be imported into client components; `getServerEnv`
 * throws if called in a browser context to make leaks loud.
 *
 * Phase 1 public pages must keep working with no Supabase configuration at
 * all, so every getter degrades gracefully instead of crashing the build.
 */

export interface PublicEnv {
  readonly supabaseUrl: string | undefined;
  readonly supabaseAnonKey: string | undefined;
  readonly siteUrl: string | undefined;
  readonly discordUrl: string | undefined;
  readonly xUrl: string | undefined;
}

export interface ServerEnv {
  /** Privileged key — server only, never expose or log. */
  readonly supabaseServiceRoleKey: string | undefined;
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function validUrl(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('protocol');
    return value;
  } catch {
    console.warn(`[env] ${label} is set but is not a valid URL; ignoring it.`);
    return undefined;
  }
}

export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: validUrl(clean(process.env.NEXT_PUBLIC_SUPABASE_URL), 'NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    siteUrl: validUrl(clean(process.env.NEXT_PUBLIC_SITE_URL), 'NEXT_PUBLIC_SITE_URL'),
    discordUrl: validUrl(clean(process.env.NEXT_PUBLIC_DISCORD_URL), 'NEXT_PUBLIC_DISCORD_URL'),
    xUrl: validUrl(clean(process.env.NEXT_PUBLIC_X_URL), 'NEXT_PUBLIC_X_URL'),
  };
}

export function getServerEnv(): ServerEnv {
  if (typeof window !== 'undefined') {
    throw new Error('getServerEnv() must never run in the browser.');
  }
  return {
    supabaseServiceRoleKey: clean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
}

/** True when the public Supabase client can be created. */
export function isSupabaseConfigured(): boolean {
  const env = getPublicEnv();
  return env.supabaseUrl !== undefined && env.supabaseAnonKey !== undefined;
}
