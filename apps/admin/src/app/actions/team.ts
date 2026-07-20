'use server';

import { redirect } from 'next/navigation';

import { ADMIN_ROLE_KEYS } from '@/lib/auth/catalog';
import {
  INVITATION_DEFAULT_EXPIRY_HOURS,
  INVITATION_MAX_EXPIRY_HOURS,
  generateInvitationToken,
  hashInvitationToken,
  invitationAcceptancePath,
} from '@/lib/auth/invitation-token';
import { getAdminPublicEnv } from '@/lib/env';
import { readTrimmedFormString } from '@/lib/forms';
import { createAdminServerClient } from '@/lib/supabase/server';

export interface InvitationLinkState {
  readonly status: 'idle' | 'created' | 'resent' | 'error';
  readonly message?: string;
  readonly acceptanceUrl?: string;
  readonly email?: string;
  readonly expiresAt?: string;
}

const KNOWN_ERROR_MESSAGES: Readonly<Record<string, string>> = {
  ADMIN_PERMISSION_DENIED: 'Your role does not allow this action.',
  INVALID_FULL_NAME: 'Enter a full name between 1 and 100 characters.',
  INVALID_EMAIL: 'Enter a valid email address.',
  INVALID_REASON: 'A reason of 3-500 characters is required.',
  INVALID_EXPIRY: `Expiry must be between 1 and ${INVITATION_MAX_EXPIRY_HOURS} hours.`,
  UNKNOWN_ROLE: 'That role does not exist.',
  MEMBER_ALREADY_EXISTS: 'That email already belongs to an administrator.',
  OPEN_INVITATION_EXISTS: 'An open invitation already exists for that email.',
  INVITATION_NOT_FOUND: 'That invitation no longer exists.',
  INVITATION_NOT_RESENDABLE: 'Only open, unexpired invitations can be resent.',
  INVITATION_NOT_REVOCABLE: 'Only open invitations can be revoked.',
  MEMBER_NOT_FOUND: 'That administrator no longer exists.',
  CANNOT_CHANGE_OWN_ROLE: 'You cannot change your own role.',
  CANNOT_SUSPEND_SELF: 'You cannot suspend your own account.',
};

function friendlyError(message: string | undefined, fallback: string): string {
  if (message !== undefined) {
    for (const [code, copy] of Object.entries(KNOWN_ERROR_MESSAGES)) {
      if (message.includes(code)) return copy;
    }
    // The last-active-Super-Admin trigger raises a full sentence.
    if (message.includes('Super Admin')) return message;
  }
  return fallback;
}

function readExpiryHours(formData: FormData): number {
  const raw = readTrimmedFormString(formData, 'expiresInHours', 8);
  const parsed = raw === undefined ? Number.NaN : Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > INVITATION_MAX_EXPIRY_HOURS) {
    return INVITATION_DEFAULT_EXPIRY_HOURS;
  }
  return parsed;
}

export async function inviteAdminAction(
  _previous: InvitationLinkState,
  formData: FormData,
): Promise<InvitationLinkState> {
  const fullName = readTrimmedFormString(formData, 'fullName', 100);
  const email = readTrimmedFormString(formData, 'email', 254);
  const roleKey = readTrimmedFormString(formData, 'roleKey', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);
  const expiresInHours = readExpiryHours(formData);

  if (!fullName || !email || !reason) {
    return { status: 'error', message: 'Full name, email, and a reason are required.' };
  }
  if (roleKey === undefined || !(ADMIN_ROLE_KEYS as readonly string[]).includes(roleKey)) {
    return { status: 'error', message: 'Choose a valid role.' };
  }

  const token = generateInvitationToken();
  const tokenHash = await hashInvitationToken(token);
  const supabase = await createAdminServerClient();

  const result = await supabase.rpc('create_admin_invitation', {
    p_full_name: fullName,
    p_email: email,
    p_role_key: roleKey,
    p_token_hash: tokenHash,
    p_expires_in_hours: expiresInHours,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    return {
      status: 'error',
      message: friendlyError(result.error.message, 'The invitation could not be created.'),
    };
  }

  const expiresAt =
    typeof result.data === 'object' && result.data !== null
      ? String(Reflect.get(result.data, 'expiresAt'))
      : undefined;

  return {
    status: 'created',
    email,
    acceptanceUrl: new URL(
      invitationAcceptancePath(token),
      getAdminPublicEnv().adminUrl,
    ).toString(),
    ...(expiresAt === undefined ? {} : { expiresAt }),
  };
}

export async function resendInvitationAction(
  _previous: InvitationLinkState,
  formData: FormData,
): Promise<InvitationLinkState> {
  const invitationId = readTrimmedFormString(formData, 'invitationId', 64);
  const email = readTrimmedFormString(formData, 'email', 254);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (invitationId === undefined || !reason) {
    return { status: 'error', message: 'A reason of 3-500 characters is required.' };
  }

  const token = generateInvitationToken();
  const tokenHash = await hashInvitationToken(token);
  const supabase = await createAdminServerClient();

  const result = await supabase.rpc('resend_admin_invitation', {
    p_invitation_id: invitationId,
    p_new_token_hash: tokenHash,
    p_expires_in_hours: readExpiryHours(formData),
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    return {
      status: 'error',
      message: friendlyError(result.error.message, 'The invitation could not be resent.'),
    };
  }

  const expiresAt =
    typeof result.data === 'object' && result.data !== null
      ? String(Reflect.get(result.data, 'expiresAt'))
      : undefined;

  return {
    status: 'resent',
    ...(email === undefined ? {} : { email }),
    acceptanceUrl: new URL(
      invitationAcceptancePath(token),
      getAdminPublicEnv().adminUrl,
    ).toString(),
    ...(expiresAt === undefined ? {} : { expiresAt }),
  };
}

function teamRedirect(notice: string): never {
  redirect(`/team?notice=${notice}`);
}

export async function revokeInvitationAction(formData: FormData): Promise<never> {
  const invitationId = readTrimmedFormString(formData, 'invitationId', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (invitationId === undefined || !reason) {
    teamRedirect('reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('revoke_admin_invitation', {
    p_invitation_id: invitationId,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    teamRedirect('action-failed');
  }
  teamRedirect('invitation-revoked');
}

export async function changeAdminRoleAction(formData: FormData): Promise<never> {
  const targetUserId = readTrimmedFormString(formData, 'targetUserId', 64);
  const roleKey = readTrimmedFormString(formData, 'roleKey', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (
    targetUserId === undefined ||
    roleKey === undefined ||
    !(ADMIN_ROLE_KEYS as readonly string[]).includes(roleKey) ||
    !reason
  ) {
    teamRedirect('reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('change_admin_role', {
    p_target_user_id: targetUserId,
    p_role_key: roleKey,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    teamRedirect(
      result.error.message.includes('Super Admin') ? 'last-super-admin' : 'action-failed',
    );
  }
  teamRedirect('role-updated');
}

export async function suspendAdminAction(formData: FormData): Promise<never> {
  const targetUserId = readTrimmedFormString(formData, 'targetUserId', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (targetUserId === undefined || !reason) {
    teamRedirect('reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('suspend_admin', {
    p_target_user_id: targetUserId,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    teamRedirect(
      result.error.message.includes('Super Admin') ? 'last-super-admin' : 'action-failed',
    );
  }
  teamRedirect('member-suspended');
}

export async function restoreAdminAction(formData: FormData): Promise<never> {
  const targetUserId = readTrimmedFormString(formData, 'targetUserId', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (targetUserId === undefined || !reason) {
    teamRedirect('reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('restore_admin', {
    p_target_user_id: targetUserId,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    teamRedirect('action-failed');
  }
  teamRedirect('member-restored');
}
