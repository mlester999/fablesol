'use server';

import { redirect } from 'next/navigation';

import { fromDatetimeLocal } from '@/lib/datetime';
import { readFormString, readTrimmedFormString } from '@/lib/forms';
import {
  ANNOUNCEMENT_SEVERITIES,
  FEATURE_OVERRIDE_STATUSES,
  type FeatureOverrides,
} from '@/lib/operations';
import { createAdminServerClient } from '@/lib/supabase/server';

function moduleRedirect(module: string, notice: string): never {
  redirect(`/${module}?notice=${notice}`);
}

function resultStatus(data: unknown): string {
  return typeof data === 'object' && data !== null
    ? String(Reflect.get(data, 'status'))
    : 'unknown';
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export async function saveAnnouncementAction(formData: FormData): Promise<never> {
  const id = readTrimmedFormString(formData, 'id', 64);
  const expectedRevision = readTrimmedFormString(formData, 'expectedRevision', 12);
  const title = readTrimmedFormString(formData, 'title', 100);
  const message = readTrimmedFormString(formData, 'message', 500);
  const severity = readTrimmedFormString(formData, 'severity', 20) ?? 'information';
  const ctaLabel = readTrimmedFormString(formData, 'ctaLabel', 40);
  const ctaUrl = readTrimmedFormString(formData, 'ctaUrl', 500);

  if (!title || !message) {
    moduleRedirect('announcements', 'missing-fields');
  }
  if (!(ANNOUNCEMENT_SEVERITIES as readonly string[]).includes(severity)) {
    moduleRedirect('announcements', 'missing-fields');
  }
  if ((ctaLabel === undefined) !== (ctaUrl === undefined)) {
    moduleRedirect('announcements', 'cta-pair');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('save_announcement', {
    p_input: {
      ...(id === undefined ? {} : { id, expectedRevision: Number(expectedRevision ?? '0') }),
      title,
      message,
      severity,
      startsAt: fromDatetimeLocal(readFormString(formData, 'startsAt', 32)) ?? '',
      endsAt: fromDatetimeLocal(readFormString(formData, 'endsAt', 32)) ?? '',
      ctaLabel: ctaLabel ?? '',
      ctaUrl: ctaUrl ?? '',
      dismissible: formData.get('dismissible') === 'on',
    },
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('announcements', 'save-failed');
  }
  if (resultStatus(result.data) === 'version_conflict') {
    moduleRedirect('announcements', 'version-conflict');
  }
  moduleRedirect('announcements', id === undefined ? 'created' : 'saved');
}

export async function publishAnnouncementAction(formData: FormData): Promise<never> {
  const id = readTrimmedFormString(formData, 'id', 64);
  const expectedRevision = Number(readTrimmedFormString(formData, 'expectedRevision', 12) ?? '0');
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (id === undefined || !reason) {
    moduleRedirect('announcements', 'reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('publish_announcement', {
    p_announcement_id: id,
    p_expected_revision: expectedRevision,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('announcements', 'save-failed');
  }
  if (resultStatus(result.data) === 'version_conflict') {
    moduleRedirect('announcements', 'version-conflict');
  }
  moduleRedirect('announcements', 'published');
}

export async function cancelAnnouncementAction(formData: FormData): Promise<never> {
  const id = readTrimmedFormString(formData, 'id', 64);
  const expectedRevision = Number(readTrimmedFormString(formData, 'expectedRevision', 12) ?? '0');
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (id === undefined || !reason) {
    moduleRedirect('announcements', 'reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('cancel_announcement', {
    p_announcement_id: id,
    p_expected_revision: expectedRevision,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('announcements', 'save-failed');
  }
  if (resultStatus(result.data) === 'version_conflict') {
    moduleRedirect('announcements', 'version-conflict');
  }
  moduleRedirect('announcements', 'cancelled');
}

// ---------------------------------------------------------------------------
// Maintenance
// ---------------------------------------------------------------------------

export async function saveMaintenanceDraftAction(formData: FormData): Promise<never> {
  const title = readTrimmedFormString(formData, 'title', 80);
  const shortMessage = readTrimmedFormString(formData, 'shortMessage', 240);

  if (!title || !shortMessage) {
    moduleRedirect('maintenance', 'missing-fields');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('save_maintenance_draft', {
    p_input: {
      enabled: formData.get('enabled') === 'on',
      title,
      shortMessage,
      detailMessage: readTrimmedFormString(formData, 'detailMessage', 2000) ?? '',
      startsAt: fromDatetimeLocal(readFormString(formData, 'startsAt', 32)) ?? '',
      expectedEndAt: fromDatetimeLocal(readFormString(formData, 'expectedEndAt', 32)) ?? '',
    },
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('maintenance', 'save-failed');
  }
  moduleRedirect('maintenance', 'saved');
}

export async function publishMaintenanceAction(formData: FormData): Promise<never> {
  const versionId = readTrimmedFormString(formData, 'versionId', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (versionId === undefined || !reason) {
    moduleRedirect('maintenance', 'reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('publish_maintenance', {
    p_version_id: versionId,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('maintenance', 'save-failed');
  }
  moduleRedirect('maintenance', 'published');
}

// ---------------------------------------------------------------------------
// Feature availability
// ---------------------------------------------------------------------------

export async function saveFeatureAvailabilityDraftAction(formData: FormData): Promise<never> {
  const reason = readTrimmedFormString(formData, 'reason', 500);
  if (!reason) {
    moduleRedirect('features', 'reason-required');
  }

  const keys = formData
    .getAll('featureKey')
    .filter((key): key is string => typeof key === 'string');
  const overrides: Record<string, { status: string; note?: string }> = {};

  for (const key of keys) {
    const status = readTrimmedFormString(formData, `status:${key}`, 40);
    if (status === undefined || status === 'registry') continue;
    if (!(FEATURE_OVERRIDE_STATUSES as readonly string[]).includes(status)) {
      moduleRedirect('features', 'invalid-overrides');
    }
    const note = readTrimmedFormString(formData, `note:${key}`, 200);
    overrides[key] = { status, ...(note === undefined ? {} : { note }) };
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('save_feature_availability_draft', {
    p_overrides: overrides as FeatureOverrides,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect(
      'features',
      result.error.message.includes('INVALID_FEATURE_OVERRIDES')
        ? 'invalid-overrides'
        : 'save-failed',
    );
  }
  moduleRedirect('features', 'saved');
}

export async function publishFeatureAvailabilityAction(formData: FormData): Promise<never> {
  const versionId = readTrimmedFormString(formData, 'versionId', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (versionId === undefined || !reason) {
    moduleRedirect('features', 'reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('publish_feature_availability', {
    p_version_id: versionId,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('features', 'save-failed');
  }
  moduleRedirect('features', 'published');
}

// ---------------------------------------------------------------------------
// Game settings
// ---------------------------------------------------------------------------

export async function saveGameSettingsDraftAction(formData: FormData): Promise<never> {
  const reason = readTrimmedFormString(formData, 'reason', 500);
  if (!reason) {
    moduleRedirect('settings', 'reason-required');
  }

  const brandColors: Record<string, string> = {};
  for (let index = 0; index < 12; index += 1) {
    const name = readTrimmedFormString(formData, `colorName:${String(index)}`, 40);
    const value = readTrimmedFormString(formData, `colorValue:${String(index)}`, 7);
    if (name && value) {
      brandColors[name] = value;
    }
  }

  const settings = {
    gameName: readTrimmedFormString(formData, 'gameName', 80) ?? '',
    publicStatusLabel: readTrimmedFormString(formData, 'publicStatusLabel', 80) ?? '',
    logoReference: readTrimmedFormString(formData, 'logoReference', 500) ?? null,
    brandColors,
    discordUrl: readTrimmedFormString(formData, 'discordUrl', 500) ?? null,
    xUrl: readTrimmedFormString(formData, 'xUrl', 500) ?? null,
    supportedNetworkLabel: readTrimmedFormString(formData, 'supportedNetworkLabel', 40) ?? '',
    fableAccessDisplay: readTrimmedFormString(formData, 'fableAccessDisplay', 80) ?? '',
    announcementsEnabled: formData.get('announcementsEnabled') === 'on',
    maintenanceBannerEnabled: formData.get('maintenanceBannerEnabled') === 'on',
  };

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('save_game_settings_draft', {
    p_settings: settings,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect(
      'settings',
      result.error.message.includes('INVALID_GAME_SETTINGS') ? 'invalid-settings' : 'save-failed',
    );
  }
  moduleRedirect('settings', 'saved');
}

export async function publishGameSettingsAction(formData: FormData): Promise<never> {
  const versionId = readTrimmedFormString(formData, 'versionId', 64);
  const reason = readTrimmedFormString(formData, 'reason', 500);

  if (versionId === undefined || !reason) {
    moduleRedirect('settings', 'reason-required');
  }

  const supabase = await createAdminServerClient();
  const result = await supabase.rpc('publish_game_settings', {
    p_version_id: versionId,
    p_reason: reason,
    p_request_id: crypto.randomUUID(),
  });

  if (result.error) {
    moduleRedirect('settings', 'save-failed');
  }
  moduleRedirect('settings', 'published');
}
