import React from 'react';
import { X, Calendar, MapPin, Trash2, ArrowRight, Bookmark, Share2 } from 'lucide-react';
import { EventItem } from '../../types';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { EventArtwork } from '../ui/EventArtwork';

export interface BookmarksDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedEvents: EventItem[];
  onRemoveBookmark: (eventId: string) => void;
  onSelectEvent: (event: EventItem) => void;
  onShareEvent?: (event: EventItem) => void;
}

export const BookmarksDrawer: React.FC<BookmarksDrawerProps> = ({
  isOpen,
  onClose,
  savedEvents,
  onRemoveBookmark,
  onSelectEvent,
  onShareEvent
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1E1814]/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-ivory border-l border-[#D8CDBC] shadow-sand-xl flex flex-col animate-in slide-in-from-right duration-300">
          {/* Drawer Header */}
          <div className="p-6 border-b border-[#D8CDBC] flex items-center justify-between bg-[#E9E2D6]/50">
            <div className="flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#8A4F33]" />
              <h3 className="font-serif text-xl font-medium text-[#1E1814]">
                Saved Events ({savedEvents.length})
              </h3>
            </div>
            <button
              onClick={onClose}
              aria-label="Close saved drawer"
              className="p-2 text-[#675A50] hover:text-[#1E1814] hover:bg-[#D8CDBC]/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List or Empty */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {savedEvents.length > 0 ? (
              savedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-[#E9E2D6]/40 rounded-2xl p-4 border border-[#D8CDBC] hover:border-[#8A4F33] transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-[#D8CDBC]">
                      <EventArtwork imageUrl={event.imageUrl} title={event.title} category={event.category} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A4F33] block">
                        {event.category}
                      </span>
                      <h4 className="font-serif text-sm font-medium text-[#1E1814] truncate mt-0.5">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#675A50] mt-1">
                        <Calendar className="w-3 h-3 text-[#8A4F33]" />
                        <span className="truncate">{event.date.split(',')[1] || event.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#D8CDBC]/60 text-xs">
                    <span className="font-semibold text-[#1E1814] tabular-nums">
                      {event.isFree ? 'Free' : `From ${formatKES(event.pricing.startingPrice)}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onShareEvent && (
                        <button
                          type="button"
                          onClick={() => onShareEvent(event)}
                          title="Share event"
                          className="p-1.5 text-[#675A50] hover:text-[#8A4F33] hover:bg-[#E9E2D6] rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveBookmark(event.id)}
                        title="Remove from saved"
                        className="p-1.5 text-[#675A50] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onSelectEvent(event);
                          onClose();
                        }}
                        icon={<ArrowRight className="w-3 h-3" />}
                        iconPosition="right"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-[#E9E2D6] flex items-center justify-center text-[#675A50] mb-3">
                  <Bookmark className="w-5 h-5 text-[#8A4F33]" />
                </div>
                <h4 className="font-serif text-lg font-medium text-[#1E1814] mb-1">
                  No saved events
                </h4>
                <p className="text-xs text-[#675A50]">
                  Tap the bookmark icon on any event to save it here for later.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {savedEvents.length > 0 && (
            <div className="p-4 border-t border-[#D8CDBC] bg-[#E9E2D6]/50 text-center">
              <span className="text-xs text-[#675A50]">
                Saved events are not reserved. Book early, tickets can sell out.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
