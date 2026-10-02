import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Share2,
  Bookmark,
  Check,
  Info,
  ShieldCheck,
  Users
} from 'lucide-react';
import { EventItem, TicketTier } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { EventArtwork } from '../ui/EventArtwork';
import { formatKES } from '../../utils/format';
import { LocationMap } from './LocationMap';

export interface EventDetailsViewProps {
  event: EventItem;
  onBack: () => void;
  onBookTickets: (event: EventItem, tier: TicketTier, quantity: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: (event: EventItem) => void;
  onSelectCategory?: (category: any) => void;
  onShare?: (event: EventItem) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  onBack,
  onBookTickets,
  isBookmarked,
  onToggleBookmark,
  onSelectCategory,
  onShare
}) => {
  // Events without tiers are booked as one general admission at the starting price
  const defaultTier = (): TicketTier =>
    event.pricing.tiers[0] || {
      id: '',
      name: 'General Admission',
      price: event.isFree ? 0 : event.pricing.startingPrice,
      description: '',
      available: Math.max(0, event.capacity - event.attendeeCount),
      perks: []
    };

  const [selectedTier, setSelectedTier] = useState<TicketTier>(defaultTier);
  const [quantity, setQuantity] = useState(1);
  const [copiedShare, setCopiedShare] = useState(false);

  // Reset the selection when another event is shown, or when availability changes after a booking
  useEffect(() => {
    setSelectedTier((current) => event.pricing.tiers.find((t) => t.id === current.id) || defaultTier());
    setQuantity(1);
  }, [event]);

  const totalPrice = event.isFree ? 0 : selectedTier.price * quantity;
  const placesLeft = Math.max(0, event.capacity - event.attendeeCount);
  const isSoldOut = event.status === 'sold_out' || placesLeft === 0 || selectedTier.available < 1;
  const location = [event.venue.neighborhood, event.venue.city].filter(Boolean).join(', ');

  const handleShare = () => {
    if (onShare) {
      onShare(event);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  return (
    <div className="w-full pb-28 animate-in fade-in duration-500">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-[#736B66] hover:text-[#2A2421] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to all events</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Share event"
            className="p-2.5 rounded-full bg-white border border-[#E2DDD5] text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA] transition-colors cursor-pointer shadow-sand-sm relative"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            {copiedShare && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#2A2421] text-white text-[11px] px-2 py-0.5 rounded whitespace-nowrap">
                Link copied
              </span>
            )}
          </button>

          <button
            onClick={() => onToggleBookmark(event)}
            aria-label={isBookmarked ? 'Remove from saved' : 'Save event'}
            className={`p-2.5 rounded-full border border-[#E2DDD5] transition-colors cursor-pointer shadow-sand-sm ${
              isBookmarked
                ? 'bg-[#C85A40] text-white border-[#C85A40]'
                : 'bg-white text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Hero header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-sand-lg border border-[#E2DDD5] bg-[#2A2421]">
          <EventArtwork imageUrl={event.imageUrl} title={event.title} category={event.category} />

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1F1916]/95 via-[#1F1916]/45 to-transparent" />

          {/* Title and Key Badges in Hero */}
          <div className="absolute inset-0 p-6 sm:p-10 md:p-12 flex flex-col justify-end text-white">
            <div className="max-w-3xl space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {onSelectCategory ? (
                  <button
                    type="button"
                    onClick={() => onSelectCategory(event.category)}
                    className="cursor-pointer hover:scale-105 transition-transform"
                    title={`Browse all ${event.category} events`}
                  >
                    <Badge variant="terracotta" size="md">
                      {event.category}
                    </Badge>
                  </button>
                ) : (
                  <Badge variant="terracotta" size="md">
                    {event.category}
                  </Badge>
                )}
                <span className="text-xs uppercase tracking-widest text-[#F4F1EA]/80 font-medium">
                  {event.status === 'published'
                    ? event.isFree
                      ? 'Free entry · Registration open'
                      : 'Booking open'
                    : event.status === 'sold_out'
                    ? 'Sold out'
                    : 'Draft · only you can see this'}
                </span>
              </div>

              <h1
                style={{ textWrap: 'balance' }}
                className="font-serif text-3xl sm:text-5xl md:text-5xl font-medium text-[#F4F1EA] tracking-tight leading-[1.15]"
              >
                {event.title}
              </h1>

              <p className="text-base sm:text-xl text-[#F4F1EA]/85 font-light max-w-2xl">
                {event.subtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Details, Host, Schedule, Venue (8 cols) */}
          <div className="lg:col-span-8 space-y-12">
            {/* Quick Metadata Bar */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DDD5] shadow-sand-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#F4F1EA] text-[#C85A40]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                    Date
                  </span>
                  <span className="font-serif text-base text-[#2A2421] font-medium block mt-0.5">
                    {event.date}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#F4F1EA] text-[#C85A40]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                    Schedule
                  </span>
                  <span className="font-serif text-base text-[#2A2421] font-medium block mt-0.5">
                    {event.time}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#F4F1EA] text-[#C85A40]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                    Location
                  </span>
                  <span className="font-serif text-base text-[#2A2421] font-medium block mt-0.5 truncate max-w-[180px]">
                    {location || event.venue.name}
                  </span>
                </div>
              </div>
            </div>

            {/* About section */}
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm space-y-6">
              <div className="border-b border-[#E2DDD5] pb-4">
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                  About
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                  About this event
                </h2>
              </div>

              <div className="prose text-[#2A2421] leading-relaxed space-y-4 font-sans text-base">
                <p className="whitespace-pre-line">
                  {event.fullContent || event.description}
                </p>
                {event.fullContent && event.description && event.description !== event.fullContent && (
                  <p className="text-[#736B66] whitespace-pre-line">
                    {event.description}
                  </p>
                )}
              </div>

              {event.curatorNote?.trim() && (
                <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E2DDD5] flex items-start gap-3 text-xs sm:text-sm text-[#736B66]">
                  <Info className="w-5 h-5 text-[#C85A40] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#2A2421] block">Note from the organizer</span>
                    {event.curatorNote}
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-[#736B66] bg-[#F4F1EA] px-3 py-1 rounded-full border border-[#E2DDD5]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              )}
            </section>

            {/* Agenda set by the organizer; hidden when there is none */}
            {event.agenda.length > 0 && (
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm">
              <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                  Programme
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                  Agenda
                </h2>
              </div>

              <div className="space-y-6">
                {event.agenda.map((item, index) => (
                  <div key={index} className="flex items-start gap-6 group">
                    <div className="shrink-0 w-20 text-right">
                      <span className="font-mono text-xs font-semibold text-[#C85A40] tracking-wider block">
                        {item.time}
                      </span>
                    </div>

                    <div className="relative pl-6 pb-6 border-l-2 border-[#E2DDD5] group-last:border-transparent flex-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-white border-2 border-[#C85A40]" />
                      <h4 className="font-serif text-lg font-medium text-[#2A2421]">
                        {item.title}
                      </h4>
                      {item.detail && (
                        <p className="text-sm text-[#736B66] mt-1 leading-relaxed">
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            )}

            {/* Organizer */}
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm">
              <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                  Organizer
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                  Presented by {event.host.name}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar
                  name={event.host.name}
                  src={event.host.avatarUrl}
                  size="xl"
                  className="border-2 border-[#E2DDD5] shadow-sand-sm"
                />
                <div>
                  <h4 className="font-serif text-xl font-medium text-[#2A2421]">
                    {event.host.name}
                  </h4>
                  {event.host.role && (
                    <span className="text-xs font-medium text-[#C85A40] uppercase tracking-wider block mb-2">
                      {event.host.role}
                    </span>
                  )}
                  {event.host.bio && (
                    <p className="text-sm text-[#736B66] leading-relaxed">
                      {event.host.bio}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Venue and map */}
            <section className="space-y-4">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm">
                <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                  <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                    Venue
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                    {event.venue.name}
                  </h2>
                </div>

                {/* Interactive Location Map Component with Venue Pin & Controls */}
                <LocationMap
                  venue={event.venue}
                  eventTitle={event.title}
                  category={event.category}
                />
              </div>
            </section>
          </div>

          {/* Right Column: Sticky booking card (4 cols) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DDD5] shadow-sand-md">
              <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#736B66] font-semibold block">
                  Tickets
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-serif text-2xl font-medium text-[#2A2421]">
                    {event.isFree ? 'Register' : 'Book tickets'}
                  </h3>
                  <div className="text-right">
                    {event.isFree ? (
                      <span className="font-serif text-xl font-bold text-emerald-700">Free</span>
                    ) : (
                      <>
                        <span className="text-xs text-[#736B66] block">From</span>
                        <span className="font-serif text-xl font-bold text-[#C85A40] tabular-nums">
                          {formatKES(event.pricing.startingPrice)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tier Selection */}
              {event.pricing.tiers.length > 0 && (
              <div className="space-y-3 mb-6">
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block">
                  Ticket type
                </label>
                {event.pricing.tiers.map((tier) => {
                  const isSelected = selectedTier.id === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#C85A40] bg-[#C85A40]/5 shadow-sand-sm'
                          : 'border-[#E2DDD5] hover:border-[#736B66] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#2A2421] text-sm">{tier.name}</span>
                        <span className="font-serif font-bold text-[#2A2421] tabular-nums">
                          {event.isFree ? 'Free' : formatKES(tier.price)}
                        </span>
                      </div>
                      {tier.description && (
                        <p className="text-xs text-[#736B66] mt-1 leading-relaxed">
                          {tier.description}
                        </p>
                      )}
                      <span className="text-[11px] text-[#736B66]/80 mt-2 block tabular-nums">
                        {tier.available > 0 ? `${tier.available} left` : 'Sold out'}
                      </span>
                    </div>
                  );
                })}
              </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-2">
                  Number of tickets
                </label>
                <div className="flex items-center justify-between p-2 bg-[#F4F1EA] rounded-2xl border border-[#E2DDD5]">
                  <button
                    type="button"
                    aria-label="Fewer tickets"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center font-bold text-[#2A2421] hover:bg-[#E2DDD5]/50 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-serif text-lg font-medium text-[#2A2421] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="More tickets"
                    onClick={() => setQuantity((q) => Math.min(selectedTier.available, q + 1))}
                    disabled={quantity >= selectedTier.available}
                    className="w-10 h-10 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center font-bold text-[#2A2421] hover:bg-[#E2DDD5]/50 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Inclusions summary */}
              {selectedTier.perks.length > 0 && (
              <div className="mb-6 p-4 bg-[#F4F1EA]/60 rounded-2xl border border-[#E2DDD5]/70 space-y-2">
                <span className="text-xs font-semibold text-[#2A2421] block">Included with {selectedTier.name}:</span>
                {selectedTier.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#736B66]">
                    <Check className="w-3.5 h-3.5 text-[#C85A40] shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              )}

              {/* Price Calculation */}
              <div className="border-t border-[#E2DDD5] pt-4 mb-6 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#736B66] block">Total</span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-3xl font-bold text-[#2A2421] tabular-nums">
                    {formatKES(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Book Action */}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={isSoldOut}
                onClick={() => onBookTickets(event, selectedTier, quantity)}
              >
                {isSoldOut ? 'Sold out' : event.isFree ? 'Register for free' : 'Proceed to checkout'}
              </Button>

              {/* Assurance Guarantee */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#736B66]">
                <ShieldCheck className="w-4 h-4 text-[#C85A40]" />
                <span>
                  {event.isFree ? 'Instant confirmation · Digital ticket issued' : 'Pay with M-Pesa · Digital ticket issued'}
                </span>
              </div>
            </div>

            {/* Attendance Stat Box */}
            <div className="bg-[#EBE6DF]/50 rounded-2xl p-5 border border-[#E2DDD5] flex items-center justify-between text-xs text-[#736B66]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C85A40]" />
                <span>Capacity</span>
              </div>
              <span className="font-semibold text-[#2A2421] tabular-nums">
                {event.attendeeCount} / {event.capacity} booked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
