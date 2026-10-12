import { describe, expect, it } from 'vitest';
import { makeEvent } from '../test/fixtures';
import { matchesSearch, normalizeText, searchEvents } from './search';

describe('normalizeText', () => {
  it('lower-cases and strips accents', () => {
    expect(normalizeText('Café NAIROBI')).toBe('cafe nairobi');
  });
});

describe('matchesSearch', () => {
  const event = makeEvent();

  it('matches when every word appears somewhere', () => {
    expect(matchesSearch(event, 'nairobi music')).toBe(true);
    expect(matchesSearch(event, 'theatre upper hill')).toBe(true);
    expect(matchesSearch(event, 'live band')).toBe(true);
    expect(matchesSearch(event, 'wanjiru')).toBe(true);
  });

  it('fails when any word is missing', () => {
    expect(matchesSearch(event, 'nairobi mombasa')).toBe(false);
  });

  it('treats an empty query as a match and finds free events by the word free', () => {
    expect(matchesSearch(event, '   ')).toBe(true);
    expect(matchesSearch(event, 'free')).toBe(false);
    expect(matchesSearch(makeEvent({ isFree: true }), 'free')).toBe(true);
  });
});

describe('searchEvents', () => {
  const today = '2026-10-12';
  const upcomingSoon = makeEvent({ id: 'a', title: 'Jazz night', isoDate: '2026-10-20', tags: ['music'] });
  const upcomingLater = makeEvent({ id: 'b', title: 'Rumba evening', isoDate: '2026-12-01', tags: ['music'] });
  const past = makeEvent({ id: 'c', title: 'Old gig', isoDate: '2026-01-01', tags: ['music'] });
  const titleMatch = makeEvent({ id: 'd', title: 'Music awards', isoDate: '2026-12-31', tags: [] });
  const draft = makeEvent({ id: 'e', title: 'Music draft', status: 'draft' });

  it('ranks title matches first, then upcoming soonest, then past; drafts are excluded', () => {
    const ids = searchEvents([past, upcomingLater, draft, upcomingSoon, titleMatch], 'music', today).map((e) => e.id);
    expect(ids).toEqual(['d', 'a', 'b', 'c']);
  });
});
