'use client';

import { useState } from 'react';
import {
  BARN_ACCESS,
  COMMUNITY_CARE,
  FARM_VISIT_CAPACITY,
  LIVE_PRESENCE,
  VISITOR_INTERACTION_MODES,
  VISITOR_RESTRICTIONS,
} from '@/content/game/farm-visits';

const TABS = [
  { id: 'presence', label: 'Live presence' },
  { id: 'modes', label: 'Permission modes' },
  { id: 'care', label: 'Community Care' },
  { id: 'privacy', label: 'Privacy boundary' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/** Owner + up to 10 visitors sharing one live farm — simple presence diagram. */
function PresenceDiagram() {
  const visitors = Array.from({ length: FARM_VISIT_CAPACITY.maxVisitors });
  return (
    <figure className="fv-presence">
      <svg
        className="fv-diagram"
        viewBox="0 0 640 175"
        role="img"
        aria-label={`One shared farm visit: the owner plus up to ${FARM_VISIT_CAPACITY.maxVisitors} visitors, ${FARM_VISIT_CAPACITY.maxTotalPlayers} players maximum.`}
      >
        <ellipse cx="320" cy="92" rx="300" ry="80" fill="#eaf2df" stroke="#4c7a3f" />
        <ellipse cx="320" cy="92" rx="230" ry="58" fill="#dcead0" opacity="0.7" />
        {/* owner */}
        <g transform="translate(320 58)">
          <circle r="17" fill="#b06b2c" />
          <circle cy="-5" r="6.5" fill="#fdf3e0" />
          <path d="M-8 10c2-6 14-6 16 0Z" fill="#fdf3e0" />
          <text y="38" textAnchor="middle" fontSize="14" fontWeight="700" fill="#22301f">
            Owner
          </text>
        </g>
        {/* ten visitors spaced evenly along a gentle arc */}
        {visitors.map((_, index) => {
          const t = index / (visitors.length - 1);
          const x = 85 + t * 470;
          const y = 105 + Math.sin(t * Math.PI) * 38;
          return (
            <g key={index} transform={`translate(${x} ${y})`}>
              <circle r="11" fill="#4f8a62" />
              <circle cy="-3.5" r="4.2" fill="#fdf9ee" />
            </g>
          );
        })}
      </svg>
      <figcaption className="fv-meter__label">
        {FARM_VISIT_CAPACITY.maxVisitors} visitors + 1 owner = {FARM_VISIT_CAPACITY.maxTotalPlayers}{' '}
        players maximum
      </figcaption>
    </figure>
  );
}

/**
 * Interactive Community Care lesson: five different visitors each add one
 * valid contribution. Educational only — nothing connects to live gameplay.
 */
function CareMeter() {
  const max = COMMUNITY_CARE.maxContributionsPerFarmPerDay;
  const [count, setCount] = useState(0);
  const full = count >= max;

  return (
    <div className="fv-meter">
      <div className="fv-meter__pips" aria-hidden="true">
        {Array.from({ length: max }).map((_, index) => (
          <span className="fv-meter__pip" data-filled={index < count} key={index}>
            {index < count ? '✓' : index + 1}
          </span>
        ))}
      </div>
      <p className="fv-meter__label">
        {count}/{max} daily care · each check is a different visitor · resets on the UTC day
      </p>
      <div className="cta-row" style={{ justifyContent: 'center' }}>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={full}
          onClick={() => setCount((value) => Math.min(max, value + 1))}
        >
          {full ? 'Daily maximum reached' : `Visitor ${count + 1} helps`}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setCount(0)}>
          Reset example
        </button>
      </div>
      <p className="live-region" aria-live="polite">
        {count === 0
          ? `No care yet today. Each valid contribution adds ${COMMUNITY_CARE.benefitPerContributionPercent}% provisional Animal Care progress.`
          : `${count} contribution${count === 1 ? '' : 's'} → +${count * COMMUNITY_CARE.benefitPerContributionPercent}% provisional Animal Care progress${
              full ? `, the ${COMMUNITY_CARE.maxDailyBenefitPercent}% daily maximum.` : '.'
            }`}
      </p>
    </div>
  );
}

export function FarmVisitExplorer() {
  const [tab, setTab] = useState<TabId>('presence');
  const [modeIndex, setModeIndex] = useState(1);
  const mode = VISITOR_INTERACTION_MODES[modeIndex]!;

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Feature preview</span>
      <h3>Inside a live farm visit</h3>
      <p>Educational example: no live farm visit occurs.</p>
      <div className="chip-row" role="tablist" aria-label="Farm visit topics">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            className="chip"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === 'presence' ? (
        <div className="panel">
          <PresenceDiagram />
          <p>
            A personal farm is one shared live space: the owner plus up to{' '}
            {FARM_VISIT_CAPACITY.maxVisitors} visitors, {FARM_VISIT_CAPACITY.maxTotalPlayers}{' '}
            players maximum. Everyone inside will eventually see each other move, emote, sit, pet
            animals, and help, live.
          </p>
          <p>{LIVE_PRESENCE.example}</p>
        </div>
      ) : null}

      {tab === 'modes' ? (
        <div className="panel">
          <div className="chip-row" role="tablist" aria-label="Visitor interaction modes">
            {VISITOR_INTERACTION_MODES.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                className="chip"
                aria-selected={modeIndex === index}
                onClick={() => setModeIndex(index)}
              >
                {index + 1}. {entry.name}
              </button>
            ))}
          </div>
          <div className="fv-mode-ladder" aria-hidden="true">
            {VISITOR_INTERACTION_MODES.map((entry, index) => (
              <span key={entry.id} data-included={index <= modeIndex}>
                {entry.name}
              </span>
            ))}
          </div>
          <h4>{mode.name}</h4>
          <p>{mode.summary}</p>
          <div className="fv-mode-columns">
            <div>
              <p className="fv-mode-columns__head" data-kind="may">
                Visitors may
              </p>
              <ul className="docs-list">
                {mode.permissions.map((permission) => (
                  <li key={permission}>{permission}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="fv-mode-columns__head" data-kind="never">
                Visitors may never
              </p>
              <ul className="docs-list">
                {VISITOR_RESTRICTIONS.never.slice(0, 5).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <p>
            <strong>{mode.note}</strong>
          </p>
          <p>
            Each mode includes everything from the mode before it: View Only → Social Interactions →
            Allow Helpers.
          </p>
        </div>
      ) : null}

      {tab === 'care' ? (
        <div className="panel">
          <CareMeter />
          <p>
            Five different visitors → maximum {COMMUNITY_CARE.maxContributionsPerFarmPerDay}/
            {COMMUNITY_CARE.maxContributionsPerFarmPerDay} daily care. One visitor counts once per
            farm per UTC day, and one helper can validly care for up to{' '}
            {COMMUNITY_CARE.maxFarmsHelpedPerVisitorPerDay} different farms per UTC day.
          </p>
          <p>
            Each valid contribution adds {COMMUNITY_CARE.benefitPerContributionPercent}% Animal Care
            progress, up to {COMMUNITY_CARE.maxDailyBenefitPercent}% per day (provisional values,
            subject to balancing).
          </p>
          <p>
            Community Care never creates COPPER, never creates materials, and never improves the 1%
            Divine chance.
          </p>
          <p>
            <strong>{COMMUNITY_CARE.coreRule}</strong>
          </p>
        </div>
      ) : null}

      {tab === 'privacy' ? (
        <div className="htp-grid">
          <div className="panel">
            <h4>Public showcase area</h4>
            <ul className="docs-list">
              {BARN_ACCESS.publicShowcase.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel" data-private="true">
            <h4>Private owner area</h4>
            <ul className="docs-list">
              {BARN_ACCESS.privateOwnerArea.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              <strong>{BARN_ACCESS.rule}</strong>
            </p>
          </div>
        </div>
      ) : null}

      <p className="sr-only" aria-live="polite">
        Showing: {TABS.find((entry) => entry.id === tab)?.label}
      </p>
    </div>
  );
}
