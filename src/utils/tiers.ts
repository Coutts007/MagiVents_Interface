import { TicketTier } from '../types';

/** Ticket types the organizer can add with one click and then edit freely. Any other name is fine too. */
export interface TierPreset {
  name: string;
  admits: number;
  description: string;
  perks: string[];
}

export const TIER_PRESETS: TierPreset[] = [
  { name: 'VVIP', admits: 1, description: 'The best seats and full hospitality', perks: ['Front-row seating', 'Lounge access'] },
  { name: 'VIP', admits: 1, description: 'Priority entry and reserved seating', perks: ['Priority entry'] },
  { name: 'Regular', admits: 1, description: 'Standard admission', perks: [] },
  { name: 'Couple', admits: 2, description: 'One ticket for two people', perks: [] },
  { name: 'Group', admits: 5, description: 'One ticket for the whole group', perks: [] },
  { name: 'Early Bird', admits: 1, description: 'A lower price for people who book early', perks: [] }
];

/**
 * The price the server will charge at `now`. The server decides at booking time; this mirrors its rule so the
 * page switches back to the normal price when a sale ends, without a reload.
 */
export function tierPriceAt(tier: TicketTier, now: number): { price: number; onSale: boolean } {
  const start = tier.saleStartsAt ? Date.parse(tier.saleStartsAt) : NaN;
  const end = tier.saleEndsAt ? Date.parse(tier.saleEndsAt) : NaN;
  const allowanceLeft = tier.saleRemaining === null || tier.saleRemaining === undefined || tier.saleRemaining > 0;
  const onSale =
    tier.salePrice !== null && tier.salePrice !== undefined && start <= now && now < end && allowanceLeft;
  return onSale ? { price: tier.salePrice as number, onSale } : { price: tier.price, onSale: false };
}

/** Seconds until the flash sale ends, or null when no sale is running at `now`. */
export function saleSecondsLeft(tier: TicketTier, now: number): number | null {
  if (!tierPriceAt(tier, now).onSale || !tier.saleEndsAt) return null;
  return Math.max(0, Math.ceil((Date.parse(tier.saleEndsAt) - now) / 1000));
}

/** Seconds until a scheduled flash sale starts, or null. */
export function saleSecondsUntilStart(tier: TicketTier, now: number): number | null {
  if (tier.salePrice === null || tier.salePrice === undefined || !tier.saleStartsAt) return null;
  const start = Date.parse(tier.saleStartsAt);
  return start > now ? Math.ceil((start - now) / 1000) : null;
}

/** The tier's own sales window: 'not_started', 'ended' or 'on_sale'. */
export function tierSalesState(tier: TicketTier, now: number): 'on_sale' | 'not_started' | 'ended' {
  if (tier.onSaleFrom && now < Date.parse(tier.onSaleFrom)) return 'not_started';
  if (tier.onSaleUntil && now >= Date.parse(tier.onSaleUntil)) return 'ended';
  return 'on_sale';
}

/** 1 -> "Admits 1 person", 2 -> "Admits 2 people" */
export function admitsLabel(people: number): string {
  return `Admits ${people} ${people === 1 ? 'person' : 'people'}`;
}

/** People a booking admits: a couple ticket admits 2 (older bookings without the field admit one per ticket). */
export function bookingPeople(booking: { quantity: number; admits?: number }): number {
  return booking.admits ?? booking.quantity;
}
