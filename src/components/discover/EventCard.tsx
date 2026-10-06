import React from 'react';
import { Calendar, MapPin, Bookmark, ArrowUpRight, Share2 } from 'lucide-react';
import { EventItem } from '../../types';
import { Badge } from '../ui/Badge';
import { EventArtwork } from '../ui/EventArtwork';
import { formatKES } from '../../utils/format';

/** "2026-10-24" -> "Sat, 24 Oct 2026" (parsed as a local date, so it never shifts a day) */
function formatEventDate(isoDate: string, fallback: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return fallback;
  return new Date(y, m - 1, d).toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export interface EventCardProps {
  event: EventItem;
  onSelect: (event: EventItem) => void;
  isBookmarked: boolean;
  onToggleBookmark: (event: EventItem) => void;
  onCategoryClick?: (category: any) => void;
  onShare?: (event: EventItem) => void;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onSelect,
  isBookmarked,
  onToggleBookmark,
  onCategoryClick,
  onShare
}) => {
  return (
    <article
      onClick={() => onSelect(event)}
      className="group relative bg-ivory rounded-3xl border border-[#D8CDBC] hover:border-[#8A4F33] transition-all duration-300 ease-out hover:-translate-y-1 shadow-sand-sm hover:shadow-sand-md overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Image Framing with 4:3 Aspect Ratio and subtle zoom on hover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#E9E2D6]">
        <EventArtwork
          imageUrl={event.imageUrl}
          title={event.title}
          category={event.category}
          imageClassName="transform transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Category Pill Tag Overlay with click-to-filter */}
        <div className="absolute top-3.5 left-3.5 z-10">
          {onCategoryClick ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCategoryClick(event.category);
              }}
              title={`Filter by ${event.category}`}
              className="cursor-pointer hover:scale-105 transition-transform"
            >
              <Badge variant="neutral" size="sm">
                {event.category}
              </Badge>
            </button>
          ) : (
            <Badge variant="neutral" size="sm">
              {event.category}
            </Badge>
          )}
        </div>

        {/* Top Right Action Group: Share & Bookmark */}
        <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5">
          {onShare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(event);
              }}
              aria-label="Share this event"
              title="Share event link"
              className="p-2 rounded-full backdrop-blur-md bg-ivory/80 hover:bg-ivory text-[#1E1814] hover:text-[#8A4F33] transition-colors duration-200 cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(event);
            }}
            aria-label={isBookmarked ? 'Remove from saved' : 'Save this event'}
            title={isBookmarked ? 'Remove from saved' : 'Save this event'}
            className={`p-2 rounded-full backdrop-blur-md transition-colors duration-200 cursor-pointer shadow-xs ${
              isBookmarked
                ? 'bg-[#8A4F33] text-white'
                : 'bg-ivory/80 hover:bg-ivory text-[#1E1814]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Price Pill */}
        {event.isFree ? (
          <div className="absolute bottom-3.5 right-3.5 z-10 bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-xs">
            Free
          </div>
        ) : (
          <div className="absolute bottom-3.5 right-3.5 z-10 bg-ivory/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-[#1E1814] shadow-xs tabular-nums">
            from {formatKES(event.pricing.startingPrice)}
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row: Date & City with subtle separator */}
          <div className="flex items-center gap-2 text-xs text-[#675A50] font-medium mb-2.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#8A4F33]" />
              {formatEventDate(event.isoDate, event.date)}
            </span>
            <span aria-hidden="true" className="text-[#D8CDBC]">·</span>
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 text-[#675A50]" />
              {event.venue.city}
            </span>
          </div>

          {/* Title in Serif */}
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#1E1814] group-hover:text-[#8A4F33] transition-colors duration-200 leading-snug mb-2 line-clamp-2">
            {event.title}
          </h2>

          {/* Truncated Sans-serif Description */}
          <p className="text-sm text-[#675A50] font-normal leading-relaxed line-clamp-2 mb-4">
            {event.description}
          </p>
        </div>

        {/* Card Footer: Capacity & Detail Affordance */}
        <div className="pt-4 border-t border-[#D8CDBC]/80 flex items-center justify-between">
          <div className="text-xs text-[#675A50]">
            <span className="font-medium text-[#1E1814] tabular-nums">
              {event.capacity - event.attendeeCount}
            </span>{' '}
            {event.capacity - event.attendeeCount === 1 ? 'place' : 'places'} left
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-medium text-[#8A4F33] group-hover:translate-x-0.5 transition-transform duration-200">
            <span>Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
};
