import {
  getAvailabilityStatus,
  getFeatureAvailability,
  type FeatureAvailabilityId,
} from '@/content/game/availability';

interface AvailabilityBadgeProps {
  readonly feature: FeatureAvailabilityId;
  readonly showNote?: boolean;
}

/**
 * Status is conveyed with a symbol plus a text label — never color alone.
 */
export function AvailabilityBadge({ feature, showNote = false }: AvailabilityBadgeProps) {
  const entry = getFeatureAvailability(feature);
  const status = getAvailabilityStatus(entry.status);
  return (
    <span className="availability-badge" data-status={status.id}>
      <span className="availability-badge__symbol" aria-hidden="true">
        {status.symbol}
      </span>
      <span className="sr-only">Feature status: </span>
      <span>{status.label}</span>
      {showNote && entry.note ? <em className="availability-badge__note">{entry.note}</em> : null}
    </span>
  );
}
