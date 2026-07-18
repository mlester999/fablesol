import { describe, expect, it } from 'vitest';
import {
  BARN_ACCESS,
  COMMUNITY_CARE,
  FARM_SHOWCASE,
  FARM_VISIT_ABUSE,
  FARM_VISIT_CAPACITY,
  FARM_VISIBILITY_OPTIONS,
  VISITOR_INTERACTION_MODES,
  VISITOR_RESTRICTIONS,
} from './farm-visits';
import { FEATURE_AVAILABILITY, getFeatureAvailability } from './availability';
import { FAQ_ITEMS } from './faq';
import { GLOSSARY } from './glossary';
import { DOCUMENTATION_PAGES, DOCUMENTATION_ROUTES } from '@/content/docs/pages';
import { searchDocumentation } from '@/content/docs/search';
import sitemap from '@/app/sitemap';

describe('farm visit capacity', () => {
  it('allows exactly 10 simultaneous visitors, owner not counted, 11 players total', () => {
    expect(FARM_VISIT_CAPACITY.maxVisitors).toBe(10);
    expect(FARM_VISIT_CAPACITY.ownerCountsAsVisitor).toBe(false);
    expect(FARM_VISIT_CAPACITY.maxTotalPlayers).toBe(11);
    expect(FARM_VISIT_CAPACITY.maxTotalPlayers).toBe(FARM_VISIT_CAPACITY.maxVisitors + 1);
  });

  it('keeps sightseeing unlimited and entry honest', () => {
    expect(FARM_VISIT_CAPACITY.dailySightseeingLimit).toBe('unlimited');
    expect(FARM_VISIT_CAPACITY.entryNote).toMatch(/not guaranteed/i);
  });

  it('offers exactly the four approved visibility options', () => {
    expect(FARM_VISIBILITY_OPTIONS.map((option) => option.name)).toEqual([
      'Public',
      'Friends Only',
      'Invite Only',
      'Private',
    ]);
  });

  it('offers exactly the three approved interaction modes in escalation order', () => {
    expect(VISITOR_INTERACTION_MODES.map((mode) => mode.name)).toEqual([
      'View Only',
      'Social Interactions',
      'Allow Helpers',
    ]);
  });
});

describe('community care limits', () => {
  it('caps a farm at 5 contributions per UTC day from different players', () => {
    expect(COMMUNITY_CARE.maxContributionsPerFarmPerDay).toBe(5);
    expect(COMMUNITY_CARE.contributorsMustBeDifferentPlayers).toBe(true);
  });

  it('caps one visitor at 1 contribution per farm per UTC day', () => {
    expect(COMMUNITY_CARE.maxContributionsPerVisitorPerFarmPerDay).toBe(1);
  });

  it('caps one helper at 5 different farms per UTC day', () => {
    expect(COMMUNITY_CARE.maxFarmsHelpedPerVisitorPerDay).toBe(5);
  });

  it('grants a provisional 1% per point up to a 5% daily maximum', () => {
    expect(COMMUNITY_CARE.benefitPerContributionPercent).toBe(1);
    expect(COMMUNITY_CARE.maxDailyBenefitPercent).toBe(5);
    expect(COMMUNITY_CARE.maxDailyBenefitPercent).toBe(
      COMMUNITY_CARE.benefitPerContributionPercent * COMMUNITY_CARE.maxContributionsPerFarmPerDay,
    );
    expect(COMMUNITY_CARE.provisional).toBe(true);
    expect(COMMUNITY_CARE.provisionalLabel).toMatch(/provisional/i);
  });

  it('resets on the UTC day with visible UTC labeling', () => {
    expect(COMMUNITY_CARE.resetRule).toMatch(/UTC/);
  });

  it('never generates COPPER, materials, or better Divine odds', () => {
    const never = COMMUNITY_CARE.never.join(' ');
    expect(never).toMatch(/COPPER/);
    expect(never).toMatch(/Milk, Meat, Leather, Eggs, or Goat Wool/);
    expect(never).toMatch(/material rarity/i);
    expect(never).toMatch(/Divine/);
    expect(never).toMatch(/tradeable/i);
    expect(COMMUNITY_CARE.coreRule).toBe(
      'Community Care provides a small social assistance benefit, but it does not create currency, valuable materials, or rare production.',
    );
  });
});

describe('visitor restrictions', () => {
  it('states that only the owner benefits economically', () => {
    expect(VISITOR_RESTRICTIONS.coreRule).toMatch(
      /only the owner can manage, collect from, or economically benefit/i,
    );
  });

  it('forbids collection, storage access, and farm manipulation', () => {
    const never = VISITOR_RESTRICTIONS.never.join(' ');
    expect(never).toMatch(/Collect Milk, Meat, Leather, Eggs, or Goat Wool/);
    expect(never).toMatch(/storage/i);
    expect(never).toMatch(/Harvest crops/i);
    expect(never).toMatch(/decorations/i);
    expect(never).toMatch(/rarity chances/i);
  });

  it('keeps private barn areas owner-only while offering a public showcase', () => {
    expect(BARN_ACCESS.publicShowcase.length).toBeGreaterThan(0);
    expect(BARN_ACCESS.privateOwnerArea.join(' ')).toMatch(/Storage/i);
    expect(BARN_ACCESS.rule).toMatch(/closed to visitors/i);
  });

  it('limits showcase animals to three on profile and three at the entrance', () => {
    expect(FARM_SHOWCASE.maxProfileShowcaseAnimals).toBe(3);
    expect(FARM_SHOWCASE.maxEntranceShowcaseAnimals).toBe(3);
    expect(FARM_SHOWCASE.privateInfo.join(' ')).toMatch(/production timer/i);
  });

  it('lists farm-visit abuse patterns for fair play', () => {
    const abuse = FARM_VISIT_ABUSE.join(' ');
    expect(abuse).toMatch(/multiple accounts/i);
    expect(abuse).toMatch(/Automated farm visiting/i);
    expect(abuse).toMatch(/reconnection/i);
  });
});

describe('farm visits documentation surface', () => {
  it('is honestly marked Planned, never Live', () => {
    expect(getFeatureAvailability('farm-visits').status).toBe('planned');
    expect(getFeatureAvailability('community-care').status).toBe('planned');
    const liveIds = FEATURE_AVAILABILITY.filter((f) => f.status === 'live').map((f) => f.id);
    expect(liveIds).not.toContain('farm-visits');
    expect(liveIds).not.toContain('community-care');
  });

  it('has a docs route wired into navigation, related pages, and the sitemap', () => {
    expect(DOCUMENTATION_ROUTES).toContain('/docs/farm-visits');
    const page = DOCUMENTATION_PAGES.find((entry) => entry.route === '/docs/farm-visits');
    expect(page).toBeDefined();
    expect(page!.section).toBe('Cozy World');
    expect(page!.availability).toBe('farm-visits');
    // Sitemap includes the route.
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.endsWith('/docs/farm-visits'))).toBe(true);
    // Every related slug must resolve to a real page.
    for (const related of page!.related) {
      expect(DOCUMENTATION_PAGES.some((entry) => entry.slug === related)).toBe(true);
    }
  });

  it('is discoverable through documentation search', () => {
    const visitResults = searchDocumentation('farm visits', 10);
    expect(visitResults.some((result) => result.route.startsWith('/docs/farm-visits'))).toBe(true);
    const careResults = searchDocumentation('community care', 10);
    expect(careResults.some((result) => result.route.startsWith('/docs/farm-visits'))).toBe(true);
  });

  it('answers the approved FAQ questions', () => {
    const questions = FAQ_ITEMS.map((item) => item.question);
    for (const expected of [
      'Can other players visit my farm?',
      'How many visitors can enter at once?',
      'Can visitors collect my animals’ materials?',
      'Can helping generate COPPER?',
      'Can I make my farm private?',
    ]) {
      expect(questions).toContain(expected);
    }
  });

  it('defines the approved glossary terms', () => {
    const terms = GLOSSARY.map((entry) => entry.term);
    for (const expected of [
      'Personal Farm',
      'Farm Visit',
      'Farm Visibility',
      'View Only',
      'Social Interactions',
      'Allow Helpers',
      'Showcase Animal',
      'Showcase Pen',
      'Community Care',
      'Care Contribution',
      'Farm Appreciation',
      'Guestbook',
      'Farm Instance',
      'Temperament',
      'Public Barn Area',
      'Private Management Area',
    ]) {
      expect(terms).toContain(expected);
    }
  });
});
