/**
 * Fablesol administrator role and permission catalog.
 *
 * Mirrors the seeded system catalog in
 * `supabase/migrations/20260718131000_admin_authorization_catalog.sql`.
 * The database is authoritative; this module only gives the app typed keys.
 * Browser-submitted values never grant access — every check re-evaluates
 * membership server-side and in RLS.
 */

export const ADMIN_ROLE_KEYS = [
  'super_admin',
  'game_administrator',
  'live_ops_manager',
  'moderator',
  'customer_support',
  'blockchain_operator',
  'read_only_analyst',
] as const;

export type AdminRoleKey = (typeof ADMIN_ROLE_KEYS)[number];

export const ADMIN_ROLE_NAMES: Readonly<Record<AdminRoleKey, string>> = {
  super_admin: 'Super Admin',
  game_administrator: 'Game Administrator',
  live_ops_manager: 'Live Ops Manager',
  moderator: 'Moderator',
  customer_support: 'Customer Support',
  blockchain_operator: 'Blockchain Operator',
  read_only_analyst: 'Read-only Analyst',
};

export const ADMIN_PERMISSION_KEYS = [
  'dashboard.view',
  'admins.view',
  'admins.invite',
  'admins.update',
  'admins.suspend',
  'admins.restore',
  'admins.revoke_invite',
  'admins.resend_invite',
  'admins.manage_roles',
  'players.view',
  'players.support_view',
  'players.access_history.view',
  'players.security_events.view',
  'announcements.view',
  'announcements.create',
  'announcements.update',
  'announcements.publish',
  'announcements.cancel',
  'maintenance.view',
  'maintenance.manage',
  'maintenance.publish',
  'features.view',
  'features.update',
  'features.publish',
  'audit.view',
  'settings.view',
  'settings.update',
  'settings.publish',
  'system.health.view',
  'system.bootstrap',
] as const;

export type AdminPermissionKey = (typeof ADMIN_PERMISSION_KEYS)[number];

export const ADMIN_STATUSES = ['invited', 'active', 'suspended'] as const;
export type AdminStatus = (typeof ADMIN_STATUSES)[number];

export const ADMIN_INVITATION_STATUSES = [
  'pending',
  'link_opened',
  'accepted',
  'expired',
  'revoked',
] as const;
export type AdminInvitationStatus = (typeof ADMIN_INVITATION_STATUSES)[number];
