import React, { useState } from 'react';
import { Calendar, MapPin, Bookmark, ArrowUpRight, Compass, Share2 } from 'lucide-react';
import { EventItem } from '../../types';
import { Badge } from '../ui/Badge';

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
  const [imageError, setImageError] = useState(false);

  return (
    <article
      onClick={() => onSelect(event)}
      className="group relative bg-white rounded-3xl border border-[#E2DDD5] hover:border-[#C85A40] transition-all duration-300 ease-out hover:-translate-y-1 shadow-sand-sm hover:shadow-sand-md overflow-hidden flex flex-col cursor-pointer"
    >
      {/* Image Framing with 4:3 Aspect Ratio and subtle zoom on hover */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F1EA]">
        {!imageError ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transform transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#EBE6DF] text-[#736B66] p-6 text-center">
            <Compass className="w-8 h-8 mb-2 text-[#C85A40]/70" />
            <span className="font-serif text-base italic text-[#2A2421]">{event.title}</span>
            <span className="text-xs uppercase tracking-widest text-[#736B66] mt-1">
              {event.category}
            </span>
          </div>
        )}

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
              className="p-2 rounded-full backdrop-blur-md bg-white/80 hover:bg-white text-[#2A2421] hover:text-[#C85A40] transition-colors duration-200 cursor-pointer shadow-xs"
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
                ? 'bg-[#C85A40] text-white'
                : 'bg-white/80 hover:bg-white text-[#2A2421]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Starting Price Pill */}
        <div className="absolute bottom-3.5 right-3.5 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-[#2A2421] shadow-xs tabular-nums">
          from ${event.pricing.startingPrice}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row: Date & City with subtle separator */}
          <div className="flex items-center gap-2 text-xs text-[#736B66] font-medium mb-2.5">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#C85A40]" />
              {event.date.split(',')[1] || event.date}
            </span>
            <span aria-hidden="true" className="text-[#E2DDD5]">·</span>
            <span className="flex items-center gap-1 truncate max-w-[150px]">
              <MapPin className="w-3.5 h-3.5 text-[#736B66]" />
              {event.venue.city}
            </span>
          </div>

          {/* Title in Serif */}
          <h2 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2421] group-hover:text-[#C85A40] transition-colors duration-200 leading-snug mb-2 line-clamp-2">
            {event.title}
          </h2>

          {/* Truncated Sans-serif Description */}
          <p className="text-sm text-[#736B66] font-normal leading-relaxed line-clamp-2 mb-4">
            {event.description}
          </p>
        </div>

        {/* Card Footer: Capacity & Detail Affordance */}
        <div className="pt-4 border-t border-[#E2DDD5]/80 flex items-center justify-between">
          <div className="text-xs text-[#736B66]">
            <span className="font-medium text-[#2A2421] tabular-nums">
              {event.capacity - event.attendeeCount}
            </span>{' '}
            places remaining
          </div>

          <div className="inline-flex items-center gap-1 text-xs font-medium text-[#C85A40] group-hover:translate-x-0.5 transition-transform duration-200">
            <span>Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </article>
  );
};
