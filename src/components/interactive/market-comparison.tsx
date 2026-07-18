'use client';

import { MARKET_SYSTEMS } from '@/content/game/economy';

export function MarketComparison() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Systems comparison</span>
      <h3>Where COPPER and items move</h3>
      <div className="table-wrap">
        <table className="docs-table">
          <caption>Market and circulation systems</caption>
          <thead>
            <tr>
              <th scope="col">System</th>
              <th scope="col">Role</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            {MARKET_SYSTEMS.map((system) => (
              <tr key={system.id}>
                <td>{system.name}</td>
                <td>{system.role}</td>
                <td>{system.tax}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
