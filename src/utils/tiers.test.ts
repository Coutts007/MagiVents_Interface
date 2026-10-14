import { describe, expect, it } from 'vitest';
import { TicketTier } from '../types';
import { admitsLabel, saleSecondsLeft, tierPriceAt, tierSalesState } from './tiers';
import { formatDuration, isoToNairobiInput, nairobiInputToIso } from './time';

const START = Date.parse('2030-03-01T09:00:00Z');
const END = Date.parse('2030-03-01T11:00:00Z');

const tier = (overrides: Partial<TicketTier> = {}): TicketTier => ({
  id: '1',
  name: 'VIP',
  price: 3000,
  description: '',
  available: 10,
  perks: [],
  salePrice: 2000,
  saleStartsAt: new Date(START).toISOString(),
  saleEndsAt: new Date(END).toISOString(),
  saleRemaining: 3,
  ...overrides
});

describe('tierPriceAt', () => {
  it('uses the sale price from the start (inclusive) to the end (exclusive)', () => {
    expect(tierPriceAt(tier(), START - 1)).toEqual({ price: 3000, onSale: false });
    expect(tierPriceAt(tier(), START)).toEqual({ price: 2000, onSale: true });
    expect(tierPriceAt(tier(), END - 1)).toEqual({ price: 2000, onSale: true });
    expect(tierPriceAt(tier(), END)).toEqual({ price: 3000, onSale: false });
  });

  it('returns the normal price once the sale allowance is used up', () => {
    expect(tierPriceAt(tier({ saleRemaining: 0 }), START + 1).onSale).toBe(false);
    expect(tierPriceAt(tier({ saleRemaining: null }), START + 1).onSale).toBe(true);
  });

  it('ignores tiers without a sale', () => {
    expect(tierPriceAt(tier({ salePrice: null }), START + 1)).toEqual({ price: 3000, onSale: false });
  });
});

describe('sale countdown and sales window', () => {
  it('counts down to the end of the sale', () => {
    expect(saleSecondsLeft(tier(), END - 90_500)).toBe(91);
    expect(saleSecondsLeft(tier(), END)).toBeNull();
  });

  it('opens and closes a tier by itself', () => {
    const early = tier({ onSaleFrom: '2030-01-01T00:00:00Z', onSaleUntil: '2030-02-01T00:00:00Z' });
    expect(tierSalesState(early, Date.parse('2029-12-31T23:59:59Z'))).toBe('not_started');
    expect(tierSalesState(early, Date.parse('2030-01-15T00:00:00Z'))).toBe('on_sale');
    expect(tierSalesState(early, Date.parse('2030-02-01T00:00:00Z'))).toBe('ended');
  });

  it('labels how many people a ticket admits', () => {
    expect(admitsLabel(1)).toBe('Admits 1 person');
    expect(admitsLabel(10)).toBe('Admits 10 people');
  });
});

describe('Nairobi time', () => {
  it('reads datetime-local values as Nairobi time and shows UTC times in Nairobi', () => {
    expect(nairobiInputToIso('2030-03-01T12:00')).toBe('2030-03-01T09:00:00.000Z');
    expect(isoToNairobiInput('2030-03-01T21:30:00Z')).toBe('2030-03-02T00:30');
    expect(nairobiInputToIso('')).toBeNull();
  });

  it('formats durations', () => {
    expect(formatDuration(64)).toBe('1m 04s');
    expect(formatDuration(3784)).toBe('1h 03m 04s');
    expect(formatDuration(93784)).toBe('1d 2h 3m');
  });
});
