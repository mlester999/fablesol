import { z } from 'zod';

import { ADMIN_PERMISSION_KEYS, ADMIN_ROLE_KEYS } from './catalog';

export const ADMIN_AUTHORIZATION_OUTCOMES = [
  'authorized',
  'unauthenticated',
  'unauthorized',
  'suspended',
] as const;

export type AdminAuthorizationOutcome = (typeof ADMIN_AUTHORIZATION_OUTCOMES)[number];

export const adminRoleKeySchema = z.enum(ADMIN_ROLE_KEYS);
export const adminPermissionKeySchema = z.enum(ADMIN_PERMISSION_KEYS);

/**
 * Trusted context returned by `public.get_current_admin_context()`
 * (see `20260718132000_admin_authorization_functions.sql`).
 */
export const adminAuthorizationContextSchema = z
  .object({
    userId: z.uuid(),
    fullName: z.string().trim().min(1).max(100),
    email: z.string().trim().min(3).max(254),
    roleKey: adminRoleKeySchema,
    roleName: z.string().trim().min(1).max(100),
    permissionKeys: z.array(adminPermissionKeySchema),
  })
  .strict();

const authorizedResultSchema = z
  .object({
    outcome: z.literal('authorized'),
    context: adminAuthorizationContextSchema,
  })
  .strict();

const deniedResultSchema = z
  .object({
    outcome: z.enum(['unauthenticated', 'unauthorized', 'suspended']),
  })
  .strict();

export const adminAuthorizationResultSchema = z.discriminatedUnion('outcome', [
  authorizedResultSchema,
  deniedResultSchema,
]);

export type AdminAuthorizationContext = z.infer<typeof adminAuthorizationContextSchema>;
export type AdminAuthorizationResult = z.infer<typeof adminAuthorizationResultSchema>;

export function isAuthorizedAdmin(
  result: AdminAuthorizationResult,
): result is z.infer<typeof authorizedResultSchema> {
  return result.outcome === 'authorized';
}

export function hasAdminPermission(
  context: AdminAuthorizationContext,
  permission: z.infer<typeof adminPermissionKeySchema>,
): boolean {
  return context.permissionKeys.includes(permission);
}
