import { describe, expect, it } from 'vitest';
import { formatKES, getInitials, normalizeWebsiteUrl, toLocalIsoDate, websiteHost } from './format';

describe('formatKES', () => {
  it('formats whole shillings with thousands separators', () => {
    expect(formatKES(1500)).toBe('KSh 1,500');
    expect(formatKES(250000)).toBe('KSh 250,000');
    expect(formatKES(1499.6)).toBe('KSh 1,500');
  });

  it('shows Free for zero unless told otherwise', () => {
    expect(formatKES(0)).toBe('Free');
    expect(formatKES(0, 'No charge')).toBe('No charge');
    expect(formatKES(0, null)).toBe('KSh 0');
  });
});

describe('getInitials', () => {
  it('uses the first letters of the first two names', () => {
    expect(getInitials('Amani Wanjiru Otieno')).toBe('AW');
    expect(getInitials('amani')).toBe('A');
    expect(getInitials('  njeri   kamau ')).toBe('NK');
  });

  it('falls back to a question mark', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
    expect(getInitials(undefined)).toBe('?');
  });
});

describe('toLocalIsoDate', () => {
  it('pads month and day', () => {
    expect(toLocalIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toLocalIsoDate(new Date(2026, 10, 28))).toBe('2026-11-28');
  });
});

describe('normalizeWebsiteUrl', () => {
  it('adds https:// to a bare address and keeps http(s) links', () => {
    expect(normalizeWebsiteUrl(' nairobitech.co.ke/summit ')).toBe('https://nairobitech.co.ke/summit');
    expect(normalizeWebsiteUrl('http://example.com')).toBe('http://example.com/');
  });

  it('rejects empty, non-web and malformed addresses', () => {
    expect(normalizeWebsiteUrl('')).toBeNull();
    expect(normalizeWebsiteUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeWebsiteUrl('ftp://files.example.com')).toBeNull();
    expect(normalizeWebsiteUrl('not a site')).toBeNull();
  });
});

describe('websiteHost', () => {
  it('shows the site name without www', () => {
    expect(websiteHost('https://www.example.co.ke/tickets')).toBe('example.co.ke');
  });
});
