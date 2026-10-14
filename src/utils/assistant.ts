import { AssistantAction, AssistantSuggestion, AssistantTier } from '../services/api';

/** The event form's content fields, as the assistant sees them. Payment details and images are never included. */
export interface AssistantFormState {
  title: string;
  tagline: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  venueCity: string;
  isFree: boolean;
  description: string;
  hostName: string;
  hostRole: string;
  /** Comma separated, as typed in the form */
  tags: string;
  attendeeNote: string;
  agenda: { time: string; title: string; detail: string }[];
  tiers: { name: string; price: string; quantity: string; admits: string; description: string; perks: string }[];
}

export type ApplyMode = 'replace' | 'append';

/**
 * Agenda items and ticket types from a suggestion, merged into the form's rows. Replace drops the current rows
 * except the ones `keep` protects (ticket types with sales cannot be removed); Append adds after them.
 */
export function applyListSuggestion<T>(existing: T[], incoming: T[], mode: ApplyMode, keep: (row: T) => boolean = () => false): T[] {
  return mode === 'append' ? [...existing, ...incoming] : [...existing.filter(keep), ...incoming];
}

/** Tags from a suggestion, as the form's comma-separated text. */
export function tagsToText(tags: string[]): string {
  return tags.join(', ');
}

/** The organizer's own words in the conversation (quick-action labels are not ideas). */
export function hasIdea(userMessages: string[]): boolean {
  return userMessages.some((m) => m.trim() && !Object.values(ACTION_LABELS).includes(m.trim()));
}

export function isBlankForm(form: AssistantFormState): boolean {
  return !form.title.trim() && !form.description.trim() && !form.category && !form.tagline.trim();
}

export const ACTION_LABELS: Record<Exclude<AssistantAction, 'chat'>, string> = {
  titles: 'Suggest titles',
  description: 'Write description',
  agenda: 'Draft agenda',
  tagline: 'Suggest tagline',
  tags: 'Suggest tags',
  tiers: 'Suggest ticket tiers',
  attendeeNote: 'Write note to attendees'
};

/**
 * Whether a quick action has what it needs. A blank form with no idea yet is handled separately (the
 * organizer is asked to describe the idea first), so this only disables actions on a partly filled form.
 */
export function actionAvailability(
  action: Exclude<AssistantAction, 'chat'>,
  form: AssistantFormState,
  idea: boolean
): { enabled: boolean; hint?: string } {
  const named = Boolean(form.title.trim()) || idea;
  switch (action) {
    case 'titles':
      return named || form.description.trim() || form.category
        ? { enabled: true }
        : { enabled: false, hint: 'Pick a category or describe your idea first' };
    case 'tags':
      return named || form.description.trim()
        ? { enabled: true }
        : { enabled: false, hint: 'Needs a title, a description or an idea' };
    case 'agenda':
      return named
        ? { enabled: true, hint: form.startTime && form.endTime ? `Fits ${form.startTime}–${form.endTime}` : undefined }
        : { enabled: false, hint: 'Needs a title or an idea' };
    default:
      return named ? { enabled: true } : { enabled: false, hint: 'Needs a title or an idea' };
  }
}

/** The parts of the event form a suggestion can change, with the form's own row types for agenda and tiers. */
export interface EditableFields<A, T> {
  title: string;
  subtitle: string;
  description: string;
  attendeeNote: string;
  category: string;
  tags: string;
  agenda: A[];
  tiers: T[];
}

export interface RowMakers<A, T> {
  agendaRow: (item: { time: string; title: string; detail: string }) => A;
  tierRow: (tier: AssistantTier) => T;
  /** Rows a Replace must keep (ticket types that already have sales) */
  keepTier: (row: T) => boolean;
}

/**
 * The change one suggestion makes to the form, as a patch with only the field it touches. Pure: the editor
 * applies the patch to its own state, and only when the organizer clicks.
 */
export function applySuggestion<A, T>(
  form: EditableFields<A, T>,
  suggestion: AssistantSuggestion,
  mode: ApplyMode,
  makers: RowMakers<A, T>
): Partial<EditableFields<A, T>> {
  switch (suggestion.field) {
    case 'title':
      return { title: suggestion.value };
    case 'tagline':
      return { subtitle: suggestion.value };
    case 'description':
      return { description: suggestion.value };
    case 'attendeeNote':
      return { attendeeNote: suggestion.value };
    case 'category':
      return { category: suggestion.value };
    case 'tags':
      return { tags: tagsToText(suggestion.value) };
    case 'agenda':
      return { agenda: applyListSuggestion(form.agenda, suggestion.value.map(makers.agendaRow), mode) };
    case 'tiers':
      return { tiers: applyListSuggestion(form.tiers, suggestion.value.map(makers.tierRow), mode, makers.keepTier) };
  }
}
