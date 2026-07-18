import 'server-only';

import { z } from 'zod';

import { createAdminServerClient } from './supabase/server';

const isoTimestamp = z.string().min(1);

export const ANNOUNCEMENT_SEVERITIES = ['information', 'success', 'warning', 'critical'] as const;
export type AnnouncementSeverity = (typeof ANNOUNCEMENT_SEVERITIES)[number];

export const announcementSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  message: z.string(),
  severity: z.enum(ANNOUNCEMENT_SEVERITIES),
  starts_at: isoTimestamp.nullable(),
  ends_at: isoTimestamp.nullable(),
  cta_label: z.string().nullable(),
  cta_url: z.string().nullable(),
  dismissible: z.boolean(),
  lifecycle_status: z.enum(['draft', 'published', 'cancelled']),
  revision: z.number().int().positive(),
  published_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});

export type Announcement = z.infer<typeof announcementSchema>;

/**
 * Mirrors `private.announcement_effective_status` so the admin list can show
 * the same effective state the public read function computes.
 */
export function announcementEffectiveStatus(
  announcement: Pick<Announcement, 'lifecycle_status' | 'starts_at' | 'ends_at'>,
  now = new Date(),
): 'draft' | 'cancelled' | 'scheduled' | 'expired' | 'active' {
  if (announcement.lifecycle_status === 'draft') return 'draft';
  if (announcement.lifecycle_status === 'cancelled') return 'cancelled';
  if (announcement.starts_at !== null && new Date(announcement.starts_at) > now) return 'scheduled';
  if (announcement.ends_at !== null && new Date(announcement.ends_at) <= now) return 'expired';
  return 'active';
}

export async function loadAnnouncements(): Promise<readonly Announcement[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase
    .from('announcements')
    .select(
      'id, title, message, severity, starts_at, ends_at, cta_label, cta_url, dismissible, lifecycle_status, revision, published_at, created_at, updated_at',
    )
    .order('updated_at', { ascending: false })
    .limit(50);
  if (result.error) {
    throw new Error('Announcements are temporarily unavailable.');
  }
  return z.array(announcementSchema).parse(result.data);
}

export const maintenanceVersionSchema = z.object({
  id: z.uuid(),
  version_number: z.number().int().positive(),
  lifecycle_status: z.enum(['draft', 'published', 'superseded']),
  enabled: z.boolean(),
  title: z.string(),
  short_message: z.string(),
  detail_message: z.string().nullable(),
  starts_at: isoTimestamp.nullable(),
  expected_end_at: isoTimestamp.nullable(),
  published_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});

export type MaintenanceVersion = z.infer<typeof maintenanceVersionSchema>;

export async function loadMaintenanceVersions(): Promise<readonly MaintenanceVersion[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase
    .from('maintenance_versions')
    .select(
      'id, version_number, lifecycle_status, enabled, title, short_message, detail_message, starts_at, expected_end_at, published_at, created_at, updated_at',
    )
    .order('version_number', { ascending: false })
    .limit(25);
  if (result.error) {
    throw new Error('Maintenance configuration is temporarily unavailable.');
  }
  return z.array(maintenanceVersionSchema).parse(result.data);
}

export const FEATURE_OVERRIDE_STATUSES = [
  'live',
  'beta',
  'planned',
  'balancing',
  'temporarily-unavailable',
] as const;
export type FeatureOverrideStatus = (typeof FEATURE_OVERRIDE_STATUSES)[number];

export const featureKeySchema = z.object({
  key: z.string(),
  name: z.string(),
});

export type FeatureKey = z.infer<typeof featureKeySchema>;

const featureOverrideEntrySchema = z
  .object({
    status: z.enum(FEATURE_OVERRIDE_STATUSES),
    note: z.string().max(200).nullish(),
  })
  .strict();

export const featureOverridesSchema = z.record(z.string(), featureOverrideEntrySchema);
export type FeatureOverrides = z.infer<typeof featureOverridesSchema>;

export const featureAvailabilityVersionSchema = z.object({
  id: z.uuid(),
  version_number: z.number().int().positive(),
  lifecycle_status: z.enum(['draft', 'published', 'superseded']),
  overrides: featureOverridesSchema,
  published_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});

export type FeatureAvailabilityVersion = z.infer<typeof featureAvailabilityVersionSchema>;

export async function loadFeatureKeys(): Promise<readonly FeatureKey[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase.from('feature_keys').select('key, name').order('key');
  if (result.error) {
    throw new Error('The feature registry is temporarily unavailable.');
  }
  return z.array(featureKeySchema).parse(result.data);
}

export async function loadFeatureAvailabilityVersions(): Promise<
  readonly FeatureAvailabilityVersion[]
> {
  const supabase = await createAdminServerClient();
  const result = await supabase
    .from('feature_availability_versions')
    .select('id, version_number, lifecycle_status, overrides, published_at, created_at, updated_at')
    .order('version_number', { ascending: false })
    .limit(25);
  if (result.error) {
    throw new Error('Feature availability versions are temporarily unavailable.');
  }
  return z.array(featureAvailabilityVersionSchema).parse(result.data);
}

export const gameSettingsSchema = z
  .object({
    gameName: z.string().min(2).max(80),
    publicStatusLabel: z.string().min(2).max(80),
    logoReference: z.string().nullish(),
    brandColors: z.record(z.string(), z.string()),
    discordUrl: z.string().nullish(),
    xUrl: z.string().nullish(),
    supportedNetworkLabel: z.string().min(2).max(40),
    fableAccessDisplay: z.string().min(2).max(80),
    announcementsEnabled: z.boolean(),
    maintenanceBannerEnabled: z.boolean(),
  })
  .strict();

export type GameSettings = z.infer<typeof gameSettingsSchema>;

export const gameSettingsVersionSchema = z.object({
  id: z.uuid(),
  version_number: z.number().int().positive(),
  lifecycle_status: z.enum(['draft', 'published', 'superseded']),
  settings: gameSettingsSchema,
  published_at: isoTimestamp.nullable(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});

export type GameSettingsVersion = z.infer<typeof gameSettingsVersionSchema>;

/** Honest starting values shown when no draft or published version exists yet. */
export const DEFAULT_GAME_SETTINGS: GameSettings = {
  gameName: 'Fablesol',
  publicStatusLabel: 'In development',
  logoReference: '/logo-no-bg.png',
  brandColors: {},
  discordUrl: null,
  xUrl: null,
  supportedNetworkLabel: 'Solana',
  fableAccessDisplay: '$FABLE access arrives in Phase 2B',
  announcementsEnabled: true,
  maintenanceBannerEnabled: true,
};

export async function loadGameSettingsVersions(): Promise<readonly GameSettingsVersion[]> {
  const supabase = await createAdminServerClient();
  const result = await supabase
    .from('game_settings_versions')
    .select('id, version_number, lifecycle_status, settings, published_at, created_at, updated_at')
    .order('version_number', { ascending: false })
    .limit(25);
  if (result.error) {
    throw new Error('Game settings versions are temporarily unavailable.');
  }
  return z.array(gameSettingsVersionSchema).parse(result.data);
}

export const AUDIT_TARGET_TYPES = [
  'admin_member',
  'admin_invitation',
  'announcement',
  'maintenance',
  'feature_availability',
  'game_settings',
  'system',
] as const;

export const auditEntrySchema = z.object({
  id: z.uuid(),
  event_key: z.string(),
  actor_user_id: z.uuid().nullable(),
  target_type: z.enum(AUDIT_TARGET_TYPES).nullable(),
  target_id: z.string().nullable(),
  reason: z.string().nullable(),
  before_state: z.record(z.string(), z.unknown()),
  after_state: z.record(z.string(), z.unknown()),
  outcome: z.enum(['success', 'denied', 'error']),
  metadata: z.record(z.string(), z.unknown()),
  created_at: isoTimestamp,
});

export type AuditEntry = z.infer<typeof auditEntrySchema>;

export interface AuditFilter {
  readonly eventPrefix?: string | undefined;
  readonly targetType?: (typeof AUDIT_TARGET_TYPES)[number] | undefined;
  readonly limit?: number | undefined;
}

export async function loadAuditEntries(filter: AuditFilter = {}): Promise<readonly AuditEntry[]> {
  const supabase = await createAdminServerClient();
  let query = supabase
    .from('admin_audit_log')
    .select(
      'id, event_key, actor_user_id, target_type, target_id, reason, before_state, after_state, outcome, metadata, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(filter.limit ?? 100, 1), 200));

  if (filter.eventPrefix) {
    query = query.like('event_key', `${filter.eventPrefix}%`);
  }
  if (filter.targetType) {
    query = query.eq('target_type', filter.targetType);
  }

  const result = await query;
  if (result.error) {
    throw new Error('The audit log is temporarily unavailable.');
  }
  return z.array(auditEntrySchema).parse(result.data);
}
