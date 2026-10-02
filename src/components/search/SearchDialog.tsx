import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Search, X } from 'lucide-react';
import { EventItem } from '../../types';
import { CATEGORY_DEFINITIONS } from '../../data/categories';
import { searchEvents } from '../../utils/search';
import { formatKES, toLocalIsoDate } from '../../utils/format';
import { EventArtwork } from '../ui/EventArtwork';
import { CategoryIcon } from '../ui/CategoryIcon';

const MAX_RESULTS = 8;

export interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventItem[];
  /** Text to start with (the current Discover search) */
  initialQuery: string;
  onSelectEvent: (event: EventItem) => void;
  /** Shows every match in the Discover grid */
  onShowAll: (query: string) => void;
}

/** Site-wide event search: instant results as you type, keyboard friendly. */
export const SearchDialog: React.FC<SearchDialogProps> = ({
  isOpen,
  onClose,
  events,
  initialQuery,
  onSelectEvent,
  onShowAll
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Start from the current Discover search each time the panel opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      setActiveIndex(-1);
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => inputRef.current?.select());
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const today = toLocalIsoDate(new Date());
  const hasQuery = query.trim().length > 0;

  const matches = useMemo(() => searchEvents(events, query, today), [events, query, today]);
  // With no query, suggest the next upcoming events
  const shown = hasQuery
    ? matches.slice(0, MAX_RESULTS)
    : matches.filter((e) => e.isoDate >= today).slice(0, 5);

  useEffect(() => setActiveIndex(-1), [query]);

  if (!isOpen) return null;

  const openEvent = (event: EventItem) => {
    onSelectEvent(event);
    onClose();
  };

  const showAll = () => {
    onShowAll(query.trim());
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown' && shown.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % shown.length);
    } else if (e.key === 'ArrowUp' && shown.length > 0) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? shown.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && shown[activeIndex]) {
        openEvent(shown[activeIndex]);
      } else if (hasQuery) {
        showAll();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[10vh] sm:pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search events"
    >
      <div className="absolute inset-0 bg-[#2A2421]/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#E2DDD5] shadow-sand-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search field */}
        <div className="flex items-center gap-3 px-5 border-b border-[#E2DDD5]">
          <Search className="w-5 h-5 text-[#C85A40] shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by event, category, town, venue or organizer"
            aria-label="Search events"
            role="combobox"
            aria-expanded={shown.length > 0}
            aria-controls="search-results"
            aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
            className="flex-1 py-5 bg-transparent text-base text-[#2A2421] placeholder-[#736B66]/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="p-1.5 rounded-full text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline text-[10px] font-medium text-[#736B66] border border-[#E2DDD5] rounded-md px-1.5 py-0.5">
            Esc
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Category shortcuts when nothing has been typed */}
          {!hasQuery && (
            <div className="px-5 pt-4 pb-2">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-[#736B66] mb-2.5">
                Browse by category
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_DEFINITIONS.filter((c) => c.id !== 'all').map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setQuery(cat.label);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2DDD5] bg-[#F4F1EA]/60 text-xs text-[#2A2421] hover:border-[#C85A40] hover:text-[#C85A40] transition-colors cursor-pointer"
                  >
                    <CategoryIcon category={cat.id} className="w-3.5 h-3.5" />
                    {cat.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          )}

          {shown.length > 0 && (
            <div className="py-2">
              <p className="px-5 pt-2 pb-1.5 text-[11px] uppercase tracking-widest font-semibold text-[#736B66]">
                {hasQuery ? `${matches.length} matching event${matches.length === 1 ? '' : 's'}` : 'Coming up'}
              </p>
              <ul id="search-results" role="listbox" aria-label="Search results">
                {shown.map((event, index) => (
                  <li
                    key={event.id}
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => openEvent(event)}
                    className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${
                      index === activeIndex ? 'bg-[#F4F1EA]' : 'hover:bg-[#F4F1EA]/60'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                      <EventArtwork
                        imageUrl={event.imageUrl}
                        title={event.title}
                        category={event.category}
                        placeholder="plain"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#2A2421] truncate">{event.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[#736B66]">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {event.date}
                        </span>
                        <span className="inline-flex items-center gap-1 min-w-0">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {[event.venue.name, event.venue.city].filter(Boolean).join(', ')}
                          </span>
                        </span>
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#736B66]">
                        <CategoryIcon category={event.category} className="w-3 h-3" />
                        {event.category}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        event.isFree || event.pricing.startingPrice === 0 ? 'text-emerald-700' : 'text-[#2A2421]'
                      }`}
                    >
                      {event.isFree ? 'Free' : formatKES(event.pricing.startingPrice)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasQuery && matches.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="font-serif text-lg text-[#2A2421]">No events match “{query.trim()}”</p>
              <p className="mt-1.5 text-xs text-[#736B66]">
                Try fewer words, a town such as “Nairobi”, or a category such as “tech” or “sports”.
              </p>
            </div>
          )}

          {!hasQuery && shown.length === 0 && (
            <p className="px-5 py-6 text-xs text-[#736B66]">No upcoming events yet.</p>
          )}
        </div>

        {/* Footer: see everything in the grid */}
        {hasQuery && matches.length > 0 && (
          <button
            type="button"
            onClick={showAll}
            className="w-full flex items-center justify-between px-5 py-3.5 border-t border-[#E2DDD5] bg-[#F4F1EA]/50 text-xs font-medium text-[#C85A40] hover:bg-[#F4F1EA] cursor-pointer"
          >
            <span>
              See all {matches.length} result{matches.length === 1 ? '' : 's'} on Discover
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
        <p className="hidden sm:block px-5 py-2.5 border-t border-[#E2DDD5] text-[10px] text-[#736B66]">
          ↑ ↓ to move · Enter to open · Esc to close · press / anywhere to search
        </p>
      </div>
    </div>
  );
};
