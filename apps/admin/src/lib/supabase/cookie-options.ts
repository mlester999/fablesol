export const ADMIN_AUTH_COOKIE_NAME = 'fablesol-admin-auth';

/**
 * localhost cookies ignore ports, so the admin portal (3601) uses its own
 * cookie name to stay isolated from any future public-site session (3600).
 */
export function adminAuthCookieOptions(adminUrl: string) {
  return {
    name: ADMIN_AUTH_COOKIE_NAME,
    path: '/',
    sameSite: 'lax' as const,
    secure: adminUrl.startsWith('https://'),
  };
}
