import React, { useState, useEffect, useId, useMemo } from 'react';
import { ArrowDown, ArrowUp, Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { AgendaItem, EventItem, EventCategory, TicketTier } from '../../types';
import { EVENT_CATEGORIES } from '../../data/categories';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageUploadZone } from '../ui/ImageUploadZone';

export interface EventEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Persists the event; rejects with a readable Error if the server refuses it */
  onSave: (event: EventItem) => Promise<void>;
  eventToEdit: EventItem | null;
}

interface AgendaRow extends AgendaItem {
  key: string;
}

/** A ticket type being edited; numbers stay strings until the form is saved */
interface TierRow {
  key: string;
  /** Server id of an existing tier, empty for a new one */
  id: string;
  name: string;
  price: string;
  quantity: string;
  description: string;
  perks: string;
  /** Tickets already sold, so the quantity cannot go below this */
  sold: number;
}

const inputClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33] disabled:bg-[#E9E2D6] disabled:text-[#675A50]';
const labelClass = 'text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1';
const hintClass = 'text-[11px] text-[#675A50] mt-1';

let rowCounter = 0;
const newRow = (item: Partial<AgendaItem> = {}): AgendaRow => ({
  key: `agenda-${++rowCounter}`,
  time: item.time || '',
  title: item.title || '',
  detail: item.detail || ''
});

let tierCounter = 0;
const newTierRow = (tier: Partial<TicketTier> = {}, isFree = false): TierRow => ({
  key: `tier-${++tierCounter}`,
  id: tier.id || '',
  name: tier.name ?? (isFree ? 'Free Entry' : 'General Admission'),
  price: tier.price ? String(tier.price) : '',
  quantity: tier.quantity !== undefined ? String(tier.quantity) : tier.available !== undefined ? String(tier.available + (tier.sold || 0)) : '',
  description: tier.description || '',
  perks: (tier.perks || []).join(', '),
  sold: tier.sold || 0
});

/** "2026-11-28" -> "Saturday, 28 Nov 2026" */
function formatDisplayDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
}

/** Pulls "HH:MM" start/end out of a stored time string such as "19:00 — 22:30". */
function parseTimeRange(time: string): [string, string] {
  const matches = time.match(/\d{1,2}:\d{2}/g) || [];
  const pad = (t?: string) => (t ? t.padStart(5, '0') : '');
  return [pad(matches[0]), pad(matches[1])];
}

/** Searchable category picker (combobox): type to filter, arrows to move, Enter or click to pick. */
const CategoryCombobox: React.FC<{ value: EventCategory | ''; onChange: (value: EventCategory) => void }> = ({
  value,
  onChange
}) => {
  const listId = useId();
  const [query, setQuery] = useState<string>(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => setQuery(value), [value]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    // Show the full list when the box still holds the chosen value
    if (!q || query === value) return EVENT_CATEGORIES;
    return EVENT_CATEGORIES.filter((c) => c.toLowerCase().includes(q));
  }, [query, value]);

  const pick = (category: EventCategory) => {
    onChange(category);
    setQuery(category);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setActiveIndex((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      // Never submit the form from the category box
      e.preventDefault();
      if (isOpen && options[activeIndex]) pick(options[activeIndex]);
    } else if (e.key === 'Escape' && isOpen) {
      e.stopPropagation();
      setIsOpen(false);
      setQuery(value);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={isOpen && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
        value={query}
        placeholder="Type to search, e.g. Tech"
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => {
          setIsOpen(false);
          // Only a real category can stay in the box
          const exact = EVENT_CATEGORIES.find((c) => c.toLowerCase() === query.trim().toLowerCase());
          if (exact) pick(exact);
          else setQuery(value);
        }}
        onKeyDown={handleKeyDown}
        className={`${inputClass} pr-9`}
      />
      <ChevronDown className="w-4 h-4 text-[#675A50] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      {isOpen && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-ivory border border-[#D8CDBC] rounded-xl shadow-sand-md py-1"
        >
          {options.length === 0 ? (
            <li className="px-4 py-2 text-xs text-[#675A50]">No matching category</li>
          ) : (
            options.map((option, index) => (
              <li
                key={option}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={option === value}
                // mousedown fires before the input's blur
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(option);
                }}
                onMouseEnter={() => setActiveIndex(index)}
                className={`px-4 py-2 text-sm cursor-pointer flex items-center justify-between ${
                  index === activeIndex ? 'bg-[#E9E2D6] text-[#1E1814]' : 'text-[#1E1814]'
                }`}
              >
                <span>{option}</span>
                {option === value && <Check className="w-4 h-4 text-[#8A4F33]" />}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export const EventEditorModal: React.FC<EventEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit
}) => {
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<EventCategory | ''>('');
  const [isoDate, setIsoDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [tiers, setTiers] = useState<TierRow[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostRole, setHostRole] = useState('');
  const [attendeeNote, setAttendeeNote] = useState('');
  const [tags, setTags] = useState('');
  const [agenda, setAgenda] = useState<AgendaRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setSaveError(null);
    if (eventToEdit) {
      const [start, end] = parseTimeRange(eventToEdit.time);
      setTitle(eventToEdit.title);
      setSubtitle(eventToEdit.subtitle);
      setCategory(EVENT_CATEGORIES.includes(eventToEdit.category) ? eventToEdit.category : '');
      setIsoDate(eventToEdit.isoDate);
      setStartTime(start);
      setEndTime(end);
      setVenueName(eventToEdit.venue.name);
      setVenueAddress(eventToEdit.venue.address);
      setVenueCity(eventToEdit.venue.city);
      setIsFree(Boolean(eventToEdit.isFree));
      setTiers(
        eventToEdit.pricing.tiers.length
          ? eventToEdit.pricing.tiers.map((tier) => newTierRow(tier))
          : [newTierRow({ price: eventToEdit.pricing.startingPrice, quantity: eventToEdit.capacity }, eventToEdit.isFree)]
      );
      setImageUrl(eventToEdit.imageUrl);
      setDescription(eventToEdit.description);
      setHostName(eventToEdit.host.name);
      setHostRole(eventToEdit.host.role);
      setAttendeeNote(eventToEdit.curatorNote || '');
      setTags(eventToEdit.tags.join(', '));
      setAgenda(eventToEdit.agenda.map((item) => newRow(item)));
    } else {
      // New events start blank; placeholders explain what to enter
      setTitle('');
      setSubtitle('');
      setCategory('');
      setIsoDate('');
      setStartTime('');
      setEndTime('');
      setVenueName('');
      setVenueAddress('');
      setVenueCity('');
      setIsFree(false);
      setTiers([newTierRow()]);
      setImageUrl('');
      setDescription('');
      setHostName('');
      setHostRole('');
      setAttendeeNote('');
      setTags('');
      setAgenda([]);
    }
  }, [eventToEdit, isOpen]);

  // --- Agenda builder -------------------------------------------------------

  const updateAgendaRow = (key: string, field: keyof AgendaItem, value: string) => {
    setAgenda((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const moveAgendaRow = (index: number, direction: -1 | 1) => {
    setAgenda((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeAgendaRow = (key: string) => {
    setAgenda((rows) => rows.filter((row) => row.key !== key));
  };

  // --- Ticket types ---------------------------------------------------------

  const updateTier = (key: string, field: keyof TierRow, value: string) => {
    setTiers((rows) => rows.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const moveTier = (index: number, direction: -1 | 1) => {
    setTiers((rows) => {
      const target = index + direction;
      if (target < 0 || target >= rows.length) return rows;
      const next = [...rows];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const removeTier = (key: string) => {
    setTiers((rows) => rows.filter((row) => row.key !== key));
  };

  // Capacity is always the total of the ticket types
  const capacity = tiers.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0);

  // --- Saving ---------------------------------------------------------------

  /** Returns the problems with the form, or an empty list when it can be saved. */
  const validate = (filledAgenda: AgendaRow[]): string[] => {
    const missing: string[] = [];
    if (!title.trim()) missing.push('event title');
    if (!category) missing.push('category');
    if (!isoDate) missing.push('date');
    if (!startTime) missing.push('start time');
    if (!venueName.trim()) missing.push('venue name');
    if (!venueCity.trim()) missing.push('town or city');
    if (tiers.length === 0) missing.push('at least one ticket type');

    const problems = missing.length ? [`Please fill in: ${missing.join(', ')}.`] : [];
    tiers.forEach((row, index) => {
      const label = row.name.trim() || `Ticket type ${index + 1}`;
      if (!row.name.trim()) problems.push(`Ticket type ${index + 1} needs a name.`);
      if (!isFree && !(Number(row.price) > 0)) problems.push(`${label} needs a price above KSh 0 (or mark the event as free).`);
      const quantity = Number(row.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) problems.push(`${label} needs a quantity of at least 1.`);
      else if (quantity < row.sold) problems.push(`${label} already has ${row.sold} sold, so its quantity cannot be lower.`);
    });
    if (endTime && startTime && endTime <= startTime) {
      problems.push('The end time must be after the start time.');
    }
    if (filledAgenda.some((row) => !row.time || !row.title.trim())) {
      problems.push('Each agenda item needs a time and a title.');
    }
    return problems;
  };

  const buildTiers = (): TicketTier[] =>
    tiers.map((row) => {
      const quantity = Number(row.quantity);
      return {
        // New tiers get a placeholder id; the server creates them and assigns a real one
        id: row.id || `tier-new-${row.key}`,
        name: row.name.trim(),
        // Free events cost nothing at every ticket type
        price: isFree ? 0 : Number(row.price),
        description: row.description.trim(),
        quantity,
        available: quantity - row.sold,
        perks: row.perks
          .split(',')
          .map((perk) => perk.trim())
          .filter(Boolean)
      };
    });

  /** The status the primary button saves with: new and draft events are published, others keep theirs */
  const primaryStatus: EventItem['status'] =
    !eventToEdit || eventToEdit.status === 'draft' ? 'published' : eventToEdit.status;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save(primaryStatus);
  };

  const save = async (status: EventItem['status']) => {
    // Rows with nothing typed in them are dropped
    const filledAgenda = agenda.filter((row) => row.time || row.title.trim() || row.detail.trim());
    const problems = validate(filledAgenda);
    if (problems.length) {
      setSaveError(problems.join(' '));
      return;
    }

    const builtTiers = buildTiers();
    // The cheapest ticket is the price shown on the event
    const startingPrice = isFree ? 0 : Math.min(...builtTiers.map((tier) => tier.price));
    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const summary = description.trim();

    const savedItem: EventItem = {
      // When editing, start from the stored event so fields this form doesn't show
      // (venue coordinates/map note, host bio/avatar, long-form content, ...) are kept
      ...eventToEdit,
      id: eventToEdit ? eventToEdit.id : `event-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim(),
      category: category as EventCategory,
      description: summary,
      // Keep separately written long-form content; otherwise it mirrors the description
      fullContent:
        eventToEdit?.fullContent && eventToEdit.fullContent !== eventToEdit.description
          ? eventToEdit.fullContent
          : summary,
      date: formatDisplayDate(isoDate),
      isoDate,
      time: endTime ? `${startTime} — ${endTime}` : startTime,
      venue: {
        neighborhood: '',
        ...eventToEdit?.venue,
        name: venueName.trim(),
        address: venueAddress.trim(),
        city: venueCity.trim()
      },
      isFree,
      pricing: {
        currency: 'KES',
        startingPrice,
        tiers: builtTiers
      },
      capacity,
      attendeeCount: eventToEdit ? eventToEdit.attendeeCount : 0,
      imageUrl,
      host: {
        avatarUrl: '',
        bio: '',
        ...eventToEdit?.host,
        // Defaults to the signed-in organizer when left blank
        name: hostName.trim() || user?.name || '',
        role: hostRole.trim()
      },
      agenda: filledAgenda.map(({ time, title: itemTitle, detail }) => ({
        time,
        title: itemTitle.trim(),
        detail: detail.trim()
      })),
      status,
      isFeatured: eventToEdit ? eventToEdit.isFeatured : false,
      tags: parsedTags,
      curatorNote: attendeeNote.trim()
    };

    setIsSaving(true);
    setSaveError(null);
    try {
      await onSave(savedItem);
      onClose();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save this event.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit event' : 'Create an event'}
      subtitle="Fields marked * are required. Publish to list the event on MagiVents, or save it as a draft that only you can see."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Event title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Nairobi Tech Week 2026"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Short tagline</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="One line that sums up the event"
              className={inputClass}
            />
          </div>
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category *</label>
            <CategoryCombobox value={category} onChange={setCategory} />
          </div>

          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" value={isoDate} onChange={(e) => setIsoDate(e.target.value)} className={inputClass} />
            {isoDate && <p className={hintClass}>Shown to attendees as {formatDisplayDate(isoDate)}</p>}
          </div>
        </div>

        {/* Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Start time *</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>End time</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} />
          </div>
        </div>

        {/* Venue */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Venue name *</label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g. KICC"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Street or landmark</label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="e.g. Harambee Avenue"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Town / city *</label>
            <input
              type="text"
              value={venueCity}
              onChange={(e) => setVenueCity(e.target.value)}
              placeholder="e.g. Nairobi"
              className={inputClass}
            />
          </div>
        </div>

        {/* Ticket types & capacity */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className={labelClass}>Ticket types *</span>
              <p className="text-[11px] text-[#675A50]">
                Capacity is the total of all ticket types:{' '}
                <strong className="text-[#1E1814] tabular-nums">{capacity}</strong>{' '}
                {capacity === 1 ? 'place' : 'places'}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setTiers((rows) => [...rows, newTierRow({ name: '' }, isFree)])}
            >
              Add ticket type
            </Button>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
              className="w-4 h-4 accent-[#8A4F33] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#1E1814]">This is a free event</span>
            {isFree && <span className="text-[11px] text-[#675A50]">Every ticket type is free</span>}
          </label>

          {tiers.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[#D8CDBC] bg-[#EFE8DD] text-xs text-[#675A50] text-center">
              Add at least one ticket type, such as <strong>General Admission</strong> or <strong>VIP</strong>.
            </div>
          ) : (
            <ol className="space-y-3">
              {tiers.map((row, index) => {
                const n = index + 1;
                return (
                  <li key={row.key} className="p-3 rounded-xl border border-[#D8CDBC] bg-[#EFE8DD] space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="mt-2.5 w-5 text-xs font-semibold text-[#675A50] shrink-0">{n}.</span>
                      <div className="grid grid-cols-2 sm:grid-cols-[1fr_120px_110px] gap-2 flex-1">
                        <input
                          type="text"
                          aria-label={`Ticket type ${n} name`}
                          value={row.name}
                          onChange={(e) => updateTier(row.key, 'name', e.target.value)}
                          placeholder="Name, e.g. VIP"
                          className={`${inputClass} col-span-2 sm:col-span-1`}
                        />
                        {isFree ? (
                          <div className={`${inputClass} text-[#675A50] bg-[#E9E2D6]`} aria-label={`Ticket type ${n} price`}>
                            Free
                          </div>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            step="1"
                            inputMode="numeric"
                            aria-label={`Ticket type ${n} price in KSh`}
                            value={row.price}
                            onChange={(e) => updateTier(row.key, 'price', e.target.value)}
                            placeholder="KSh price"
                            className={inputClass}
                          />
                        )}
                        <input
                          type="number"
                          min={Math.max(1, row.sold)}
                          step="1"
                          inputMode="numeric"
                          aria-label={`Ticket type ${n} quantity`}
                          value={row.quantity}
                          onChange={(e) => updateTier(row.key, 'quantity', e.target.value)}
                          placeholder="Quantity"
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => moveTier(index, -1)}
                          disabled={index === 0}
                          aria-label={`Move ticket type ${n} up`}
                          className="p-2 rounded-lg text-[#675A50] hover:text-[#1E1814] hover:bg-ivory disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTier(index, 1)}
                          disabled={index === tiers.length - 1}
                          aria-label={`Move ticket type ${n} down`}
                          className="p-2 rounded-lg text-[#675A50] hover:text-[#1E1814] hover:bg-ivory disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTier(row.key)}
                          disabled={row.sold > 0}
                          aria-label={`Remove ticket type ${n}`}
                          title={row.sold > 0 ? 'Tickets of this type are already sold, so it cannot be removed' : undefined}
                          className="p-2 rounded-lg text-[#675A50] hover:text-red-700 hover:bg-ivory disabled:opacity-30 cursor-pointer disabled:cursor-default"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="pl-7 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        aria-label={`Ticket type ${n} description`}
                        value={row.description}
                        onChange={(e) => updateTier(row.key, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className={inputClass}
                      />
                      <input
                        type="text"
                        aria-label={`Ticket type ${n} perks`}
                        value={row.perks}
                        onChange={(e) => updateTier(row.key, 'perks', e.target.value)}
                        placeholder="Perks, comma separated (optional)"
                        className={inputClass}
                      />
                    </div>
                    {row.sold > 0 && (
                      <p className="pl-7 text-[11px] text-[#675A50]">
                        {row.sold} sold · {Math.max(0, (Number(row.quantity) || 0) - row.sold)} left
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </div>

        {/* Image */}
        <div className="pt-1">
          <ImageUploadZone
            label="Event poster or image"
            helperText="Optional · landscape images work best"
            value={imageUrl}
            onChange={(newUrl) => setImageUrl(newUrl)}
            aspectRatio="16:9"
            shape="rounded"
            maxDimension={{ width: 1920, height: 1080 }}
            uploadButtonText="Upload poster or image"
            allowUrlInput={true}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelClass}>Event description</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will happen, who it is for, and what attendees should bring or expect"
            className={inputClass}
          />
        </div>

        {/* Agenda */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className={labelClass}>Agenda</span>
              <p className="text-[11px] text-[#675A50]">Optional · add the programme in the order it happens</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setAgenda((rows) => [...rows, newRow()])}
            >
              Add item
            </Button>
          </div>

          {agenda.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-[#D8CDBC] bg-[#EFE8DD] text-xs text-[#675A50] text-center">
              No agenda yet. Select <strong>Add item</strong> to add sessions such as registration, talks or performances.
            </div>
          ) : (
            <ol className="space-y-3">
              {agenda.map((row, index) => (
                <li key={row.key} className="p-3 rounded-xl border border-[#D8CDBC] bg-[#EFE8DD] space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="mt-2.5 w-5 text-xs font-semibold text-[#675A50] shrink-0">{index + 1}.</span>
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-2 flex-1">
                      <input
                        type="time"
                        aria-label={`Agenda item ${index + 1} time`}
                        value={row.time}
                        onChange={(e) => updateAgendaRow(row.key, 'time', e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        aria-label={`Agenda item ${index + 1} title`}
                        value={row.title}
                        onChange={(e) => updateAgendaRow(row.key, 'title', e.target.value)}
                        placeholder="e.g. Registration and networking"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveAgendaRow(index, -1)}
                        disabled={index === 0}
                        aria-label={`Move agenda item ${index + 1} up`}
                        className="p-2 rounded-lg text-[#675A50] hover:text-[#1E1814] hover:bg-ivory disabled:opacity-30 cursor-pointer disabled:cursor-default"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveAgendaRow(index, 1)}
                        disabled={index === agenda.length - 1}
                        aria-label={`Move agenda item ${index + 1} down`}
                        className="p-2 rounded-lg text-[#675A50] hover:text-[#1E1814] hover:bg-ivory disabled:opacity-30 cursor-pointer disabled:cursor-default"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAgendaRow(row.key)}
                        aria-label={`Remove agenda item ${index + 1}`}
                        className="p-2 rounded-lg text-[#675A50] hover:text-red-700 hover:bg-ivory cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="pl-7">
                    <input
                      type="text"
                      aria-label={`Agenda item ${index + 1} details`}
                      value={row.detail}
                      onChange={(e) => updateAgendaRow(row.key, 'detail', e.target.value)}
                      placeholder="Details (optional), e.g. speaker or room"
                      className={inputClass}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* Host */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Host or organizer name</label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder={user?.name ? `Leave blank to use ${user.name}` : 'Person or organization hosting'}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Host title or organization</label>
            <input
              type="text"
              value={hostRole}
              onChange={(e) => setHostRole(e.target.value)}
              placeholder="e.g. Event coordinator"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tags & Note */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma separated, e.g. networking, startups"
              className={inputClass}
            />
            <p className={hintClass}>Tags help people find your event in search.</p>
          </div>

          <div>
            <label className={labelClass}>Note to attendees</label>
            <input
              type="text"
              value={attendeeNote}
              onChange={(e) => setAttendeeNote(e.target.value)}
              placeholder="e.g. Bring your national ID for entry"
              className={inputClass}
            />
          </div>
        </div>

        {saveError && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-[#D8CDBC] flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="secondary" type="button" disabled={isSaving} onClick={() => save('draft')}>
            {eventToEdit && eventToEdit.status !== 'draft' ? 'Unpublish as draft' : 'Save as draft'}
          </Button>
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : primaryStatus === eventToEdit?.status ? 'Save changes' : 'Publish event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
