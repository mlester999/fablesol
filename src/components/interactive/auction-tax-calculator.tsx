'use client';

import { useMemo, useState } from 'react';
import { calculateAuctionHouseSplit } from '@/content/game/economy';
import { formatCopper } from '@/lib/format';

export function AuctionTaxCalculator() {
  const [price, setPrice] = useState(1000);
  const split = useMemo(() => calculateAuctionHouseSplit(price), [price]);

  return (
    <div className="interactive-card">
      <span className="interactive-card__label">Documentation calculator</span>
      <h3>Auction House 10% tax</h3>
      <p>No real listings are created. Tax rate is exactly 10%.</p>
      <div className="field">
        <label htmlFor="sale-price">Hypothetical sale price (COPPER)</label>
        <input
          id="sale-price"
          type="number"
          min={0}
          step={1}
          value={price}
          onChange={(event) => setPrice(Math.max(0, Number(event.target.value) || 0))}
        />
      </div>
      <div className="stat-grid">
        <div className="stat-pill">
          <span>Gross sale</span>
          <strong>{formatCopper(split.gross)}</strong>
        </div>
        <div className="stat-pill">
          <span>Tax (10%)</span>
          <strong>{formatCopper(split.tax)}</strong>
        </div>
        <div className="stat-pill">
          <span>Seller receives</span>
          <strong>{formatCopper(split.sellerReceives)}</strong>
        </div>
      </div>
      <p className="live-region" aria-live="polite">
        Sale {split.gross} → tax {split.tax} → seller {split.sellerReceives} COPPER.
      </p>
    </div>
  );
}
