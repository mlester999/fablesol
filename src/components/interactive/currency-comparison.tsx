'use client';

export function CurrencyComparison() {
  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Currency comparison</span>
      <h3>COPPER vs $FABLE</h3>
      <div className="htp-grid">
        <div className="panel">
          <h3>COPPER</h3>
          <ul className="docs-list">
            <li>Off-chain</li>
            <li>Used within the game economy</li>
            <li>Earned and circulated through game systems</li>
            <li>Not a cryptocurrency</li>
          </ul>
        </div>
        <div className="panel">
          <h3>$FABLE</h3>
          <ul className="docs-list">
            <li>On-chain Solana token</li>
            <li>Held in a compatible wallet</li>
            <li>Used for the 10,000 access requirement</li>
            <li>May appear in official sponsored rewards</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
