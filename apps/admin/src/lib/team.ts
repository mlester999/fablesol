import 'server-only';

import { z } from 'zod';

import { adminRoleKeySchema } from './auth/types';
import { createAdminServerClient } from './supabase/server';

const isoTimestamp = z.string().min(1);

export const adminMemberSchema = z
  .object({
    userId: z.uuid(),
    fullName: z.string(),
    email: z.string(),
    roleKey: adminRoleKeySchema,
    roleName: z.string(),
    status: z.enum(['invited', 'active', 'suspended']),
    emailConfirmedAt: isoTimestamp.nullable(),
    lastSignInAt: isoTimestamp.nullable(),
    createdAt: isoTimestamp,
    updatedAt: isoTimestamp,
    suspendedAt: isoTimestamp.nullable(),
    suspensionReason: z.string().nullable(),
  })
  .strict();

export const adminInvitationSchema = z
  .object({
    id: z.uuid(),
    email: z.string(),
    fullName: z.string(),
    roleKey: adminRoleKeySchema,
    roleName: z.string(),
    status: z.enum(['pending', 'link_opened', 'accepted', 'expired', 'revoked']),
    invitedBy: z.string().nullable(),
    createdAt: isoTimestamp,
    expiresAt: isoTimestamp,
    linkOpenedAt: isoTimestamp.nullable(),
    acceptedAt: isoTimestamp.nullable(),
    revokedAt: isoTimestamp.nullable(),
    resendCount: z.number().int().min(0),
  })
  .strict();

export type AdminMember = z.infer<typeof adminMemberSchema>;
export type AdminInvitation = z.infer<typeof adminInvitationSchema>;

export async function loadAdminMembers(): Promise<readonly AdminMember[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('get_admin_members');
  if (result.error) {
    throw new Error('Administrator list is temporarily unavailable.');
  }
  return z.array(adminMemberSchema).parse(result.data ?? []);
}

export async function loadAdminInvitations(): Promise<readonly AdminInvitation[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('get_admin_invitations');
  if (result.error) {
    throw new Error('Invitation list is temporarily unavailable.');
  }
  return z.array(adminInvitationSchema).parse(result.data ?? []);
}
