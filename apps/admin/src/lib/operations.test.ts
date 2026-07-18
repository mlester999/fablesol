import { describe, expect, it } from 'vitest';

import { fromDatetimeLocal, toDatetimeLocal } from './datetime';
import { announcementEffectiveStatus, featureOverridesSchema, gameSettingsSchema } from './operations';

describe('announcementEffectiveStatus', () => {
  const now = new Date('2026-07-18T12:00:00Z');

  it('mirrors the database status ladder', () => {
    expect(
      announcementEffectiveStatus(
        { lifecycle_status: 'draft', starts_at: null, ends_at: null },
        now,
      ),
    ).toBe('draft');
    expect(
      announcementEffectiveStatus(
        { lifecycle_status: 'cancelled', starts_at: null, ends_at: null },
        now,
      ),
    ).toBe('cancelled');
    expect(
      announcementEffectiveStatus(
        { lifecycle_status: 'published', starts_at: '2026-07-19T00:00:00Z', ends_at: null },
        now,
      ),
    ).toBe('scheduled');
    expect(
      announcementEffectiveStatus(
        {
          lifecycle_status: 'published',
          starts_at: '2026-07-17T00:00:00Z',
          ends_at: '2026-07-18T00:00:00Z',
        },
        now,
      ),
    ).toBe('expired');
    expect(
      announcementEffectiveStatus(
        { lifecycle_status: 'published', starts_at: '2026-07-17T00:00:00Z', ends_at: null },
        now,
      ),
    ).toBe('active');
  });
});

describe('feature overrides schema', () => {
  it('accepts valid overrides and rejects unknown statuses', () => {
    expect(
      featureOverridesSchema.safeParse({ farming: { status: 'beta', note: 'Testing' } }).success,
    ).toBe(true);
    expect(featureOverridesSchema.safeParse({ farming: { status: 'soon' } }).success).toBe(false);
    expect(
      featureOverridesSchema.safeParse({ farming: { status: 'beta', extra: true } }).success,
    ).toBe(false);
  });
});

describe('game settings schema', () => {
  it('matches the database validator shape', () => {
    expect(
      gameSettingsSchema.safeParse({
        gameName: 'Fablesol',
        publicStatusLabel: 'In development',
        logoReference: '/logo-no-bg.png',
        brandColors: { primary: '#2f5d46' },
        discordUrl: null,
        xUrl: null,
        supportedNetworkLabel: 'Solana',
        fableAccessDisplay: '$FABLE access arrives in Phase 2B',
        announcementsEnabled: true,
        maintenanceBannerEnabled: true,
      }).success,
    ).toBe(true);

    expect(
      gameSettingsSchema.safeParse({ gameName: 'F' }).success,
    ).toBe(false);
  });
});

describe('datetime-local helpers', () => {
  it('round-trips values and treats empty input as null', () => {
    expect(fromDatetimeLocal(undefined)).toBeNull();
    expect(fromDatetimeLocal('')).toBeNull();
    expect(fromDatetimeLocal('garbage')).toBeNull();

    const local = toDatetimeLocal('2026-07-18T09:30:00.000Z');
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    const roundTripped = fromDatetimeLocal(local);
    expect(roundTripped).not.toBeNull();
    expect(new Date(roundTripped as string).getTime()).toBe(
      new Date('2026-07-18T09:30:00.000Z').getTime(),
    );
  });

  it('renders empty for null', () => {
    expect(toDatetimeLocal(null)).toBe('');
  });
});
