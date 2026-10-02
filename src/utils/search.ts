import { EventItem } from '../types';

/** Lower-cases and strips accents so "Café" matches "cafe". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

function searchTerms(query: string): string[] {
  return normalizeText(query).split(/\s+/).filter(Boolean);
}

/** Everything a search can match on: title, description, category, venue, town, organizer, tags and date. */
function searchableText(event: EventItem): string {
  return normalizeText(
    [
      event.title,
      event.subtitle,
      event.description,
      event.category,
      event.venue.name,
      event.venue.address,
      event.venue.city,
      event.venue.neighborhood,
      event.host.name,
      event.date,
      event.isFree ? 'free' : '',
      ...event.tags
    ].join(' ')
  );
}

/** True when every word of the query appears somewhere in the event (an empty query matches everything). */
export function matchesSearch(event: EventItem, query: string): boolean {
  const terms = searchTerms(query);
  if (terms.length === 0) return true;
  const text = searchableText(event);
  return terms.every((term) => text.includes(term));
}

/**
 * Matching events, best first: title matches before other matches, then upcoming events
 * soonest first, then past events. Drafts are excluded.
 */
export function searchEvents(events: EventItem[], query: string, today: string): EventItem[] {
  const terms = searchTerms(query);
  const titleScore = (event: EventItem) => {
    const title = normalizeText(event.title);
    return terms.filter((term) => title.includes(term)).length;
  };

  return events
    .filter((event) => event.status !== 'draft' && matchesSearch(event, query))
    .sort((a, b) => {
      const byTitle = titleScore(b) - titleScore(a);
      if (byTitle !== 0) return byTitle;
      const aPast = a.isoDate < today;
      const bPast = b.isoDate < today;
      if (aPast !== bPast) return aPast ? 1 : -1;
      return aPast ? b.isoDate.localeCompare(a.isoDate) : a.isoDate.localeCompare(b.isoDate);
    });
}
