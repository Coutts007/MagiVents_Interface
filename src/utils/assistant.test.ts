import { describe, expect, it } from 'vitest';
import {
  actionAvailability,
  applyListSuggestion,
  applySuggestion,
  AssistantFormState,
  EditableFields,
  hasIdea,
  isBlankForm,
  tagsToText
} from './assistant';

const agendaRow = (time: string, title: string) => ({ time, title, detail: '' });
const tierRow = (name: string, sold = 0) => ({ name, sold });

const blank: AssistantFormState = {
  title: '', tagline: '', category: '', date: '', startTime: '', endTime: '', venueName: '', venueAddress: '',
  venueCity: '', isFree: false, description: '', hostName: '', hostRole: '', tags: '', attendeeNote: '',
  agenda: [], tiers: []
};

describe('applyListSuggestion', () => {
  it('replaces or appends agenda items', () => {
    const current = [agendaRow('09:00', 'Welcome')];
    const suggested = [agendaRow('10:00', 'Talk'), agendaRow('11:00', 'Lunch')];
    expect(applyListSuggestion(current, suggested, 'replace')).toEqual(suggested);
    expect(applyListSuggestion(current, suggested, 'append')).toEqual([...current, ...suggested]);
    expect(current).toEqual([agendaRow('09:00', 'Welcome')]);
  });

  it('keeps ticket types with sales when replacing tiers', () => {
    const current = [tierRow('Old VIP', 5), tierRow('Unsold')];
    const suggested = [tierRow('Regular'), tierRow('VIP')];
    const keepSold = (row: { sold: number }) => row.sold > 0;
    expect(applyListSuggestion(current, suggested, 'replace', keepSold).map((t) => t.name)).toEqual(['Old VIP', 'Regular', 'VIP']);
    expect(applyListSuggestion(current, suggested, 'append', keepSold).map((t) => t.name)).toEqual([
      'Old VIP',
      'Unsold',
      'Regular',
      'VIP'
    ]);
  });
});

describe('quick actions', () => {
  it('knows a blank form and the organizer’s idea', () => {
    expect(isBlankForm(blank)).toBe(true);
    expect(isBlankForm({ ...blank, title: 'Karura 5K' })).toBe(false);
    expect(hasIdea(['Suggest titles'])).toBe(false);
    expect(hasIdea(['A charity run at Karura'])).toBe(true);
  });

  it('disables actions that lack what they need', () => {
    const withCategory = { ...blank, category: 'Sports & Outdoors' };
    expect(actionAvailability('titles', withCategory, false).enabled).toBe(true);
    expect(actionAvailability('agenda', withCategory, false)).toEqual({ enabled: false, hint: 'Needs a title or an idea' });
    expect(actionAvailability('agenda', { ...withCategory, title: 'Run', startTime: '07:00', endTime: '11:00' }, false)).toEqual({
      enabled: true,
      hint: 'Fits 07:00–11:00'
    });
    expect(actionAvailability('description', withCategory, true).enabled).toBe(true);
  });

  it('writes tags as the form expects them', () => {
    expect(tagsToText(['running', 'charity'])).toBe('running, charity');
  });
});

describe('applySuggestion (writing a suggestion into the form state)', () => {
  type Agenda = { key: string; time: string; title: string; detail: string };
  type Tier = { key: string; name: string; price: string; sold: number };
  let counter = 0;
  const makers = {
    agendaRow: (item: { time: string; title: string; detail: string }): Agenda => ({ key: `a${++counter}`, ...item }),
    tierRow: (tier: { name: string; price: number }): Tier => ({ key: `t${++counter}`, name: tier.name, price: String(tier.price), sold: 0 }),
    keepTier: (row: Tier) => row.sold > 0
  };
  const form: EditableFields<Agenda, Tier> = {
    title: 'Old', subtitle: '', description: '', attendeeNote: '', category: '', tags: 'old',
    agenda: [{ key: 'x', time: '09:00', title: 'Welcome', detail: '' }],
    tiers: [
      { key: 'sold', name: 'VIP', price: '3000', sold: 4 },
      { key: 'unsold', name: 'Regular', price: '1000', sold: 0 }
    ]
  };
  const agenda = { field: 'agenda' as const, value: [{ time: '10:00', title: 'Run', detail: '5K' }] };
  const tiers = {
    field: 'tiers' as const,
    value: [{ name: 'Early Bird', price: 800, quantity: 50, admits: 1, description: '', perks: [] }]
  };

  it('replaces or appends the agenda', () => {
    expect(applySuggestion(form, agenda, 'replace', makers).agenda?.map((r) => r.title)).toEqual(['Run']);
    expect(applySuggestion(form, agenda, 'append', makers).agenda?.map((r) => r.title)).toEqual(['Welcome', 'Run']);
  });

  it('replaces or appends ticket types, never dropping one with sales', () => {
    expect(applySuggestion(form, tiers, 'replace', makers).tiers?.map((r) => r.name)).toEqual(['VIP', 'Early Bird']);
    expect(applySuggestion(form, tiers, 'append', makers).tiers?.map((r) => r.name)).toEqual(['VIP', 'Regular', 'Early Bird']);
    expect(applySuggestion(form, tiers, 'append', makers).tiers?.[2].price).toBe('800');
  });

  it('writes single fields and touches nothing else', () => {
    expect(applySuggestion(form, { field: 'title', value: 'Karura 5K' }, 'replace', makers)).toEqual({ title: 'Karura 5K' });
    expect(applySuggestion(form, { field: 'tagline', value: 'Run for a cause' }, 'replace', makers)).toEqual({
      subtitle: 'Run for a cause'
    });
    expect(applySuggestion(form, { field: 'tags', value: ['running', 'charity'] }, 'replace', makers)).toEqual({
      tags: 'running, charity'
    });
    expect(form.title).toBe('Old');
  });
});
