'use client';

import { EQUIPMENT_SLOTS } from '@/content/game/cat-battle';

const EXAMPLES = [
  {
    slot: 'Weapon',
    name: 'Reededge Blade (example label)',
    rarity: 'Rare',
    note: 'Offense-focused slot',
  },
  {
    slot: 'Armor',
    name: 'Barnwood Mail (example label)',
    rarity: 'Uncommon',
    note: 'HP / Defense focus',
  },
  {
    slot: 'Accessory',
    name: 'Sunthread Charm (example label)',
    rarity: 'Epic',
    note: 'Small specialized bonus',
  },
] as const;

export function EquipmentLoadout() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Educational loadout preview</span>
      <h3>Three equipment slots</h3>
      <p>
        Exactly Weapon, Armor, and Accessory. Example names are labels only — not finalized loot
        tables.
      </p>
      <div className="htp-grid">
        {EQUIPMENT_SLOTS.map((slot, index) => (
          <div className="panel" key={slot.id}>
            <h3>{slot.name}</h3>
            <p>{slot.role}</p>
            <p>
              <strong>Example:</strong> {EXAMPLES[index]?.name}
            </p>
            <p>
              <strong>Example rarity label:</strong> {EXAMPLES[index]?.rarity}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
