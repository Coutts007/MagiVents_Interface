import React, { useState } from 'react';
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
  Compass,
  Users,
  ExternalLink
} from 'lucide-react';
import { EventItem, TicketTier } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { LocationMap } from './LocationMap';

export interface EventDetailsViewProps {
  event: EventItem;
  onBack: () => void;
  onBookTickets: (event: EventItem, tier: TicketTier, quantity: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: (event: EventItem) => void;
  onSelectCategory?: (category: any) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  onBack,
  onBookTickets,
  isBookmarked,
  onToggleBookmark,
  onSelectCategory
}) => {
  const [selectedTier, setSelectedTier] = useState<TicketTier>(
    event.pricing.tiers[0] || {
      id: 'default',
      name: 'General Admission',
      price: event.pricing.startingPrice,
      description: 'Standard admission to the gathering.',
      available: 20,
      perks: ['Full program access']
    }
  );
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const totalPrice = selectedTier.price * quantity;

  const handleShare = () => {
    if (navigator.clipboard) {
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
          <span>Back to all gatherings</span>
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
            aria-label={isBookmarked ? 'Remove from saved' : 'Save gathering'}
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

      {/* Cinematic Hero Header with Parallax Aspect */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-sand-lg border border-[#E2DDD5] bg-[#2A2421]">
          {!imageError ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#342D28] flex items-center justify-center p-8">
              <Compass className="w-12 h-12 text-[#C85A40]/60" />
            </div>
          )}

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
                    title={`Browse all ${event.category} gatherings`}
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
                  {event.status === 'published' ? 'Reservations Open' : 'Private Salon'}
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
                    {event.venue.neighborhood}, {event.venue.city}
                  </span>
                </div>
              </div>
            </div>

            {/* Curatorial Essay / About Section */}
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm space-y-6">
              <div className="border-b border-[#E2DDD5] pb-4">
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                  Curatorial Statement
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                  About This Experience
                </h2>
              </div>

              <div className="prose text-[#2A2421] leading-relaxed space-y-4 font-sans text-base">
                <p className="first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-[#C85A40]">
                  {event.fullContent}
                </p>
                <p className="text-[#736B66]">
                  {event.description}
                </p>
              </div>

              {event.curatorNote && (
                <div className="p-4 rounded-2xl bg-[#F4F1EA] border border-[#E2DDD5] flex items-start gap-3 text-xs sm:text-sm text-[#736B66]">
                  <Info className="w-5 h-5 text-[#C85A40] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#2A2421] block">Curator’s Note:</span>
                    {event.curatorNote}
                  </div>
                </div>
              )}

              {/* Tags */}
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
            </section>

            {/* Program Agenda / Timeline */}
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm">
              <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                  Sequence of Events
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                  The Evening Agenda
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
                      <p className="text-sm text-[#736B66] mt-1 leading-relaxed">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Host & Creator Spotlight */}
            <section className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm">
              <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                  Host & Curation
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-1">
                  Presented by {event.host.name}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {event.host.avatarUrl && (
                  <img
                    src={event.host.avatarUrl}
                    alt={event.host.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-[#E2DDD5] shadow-sand-sm shrink-0"
                  />
                )}
                <div>
                  <h4 className="font-serif text-xl font-medium text-[#2A2421]">
                    {event.host.name}
                  </h4>
                  <span className="text-xs font-medium text-[#C85A40] uppercase tracking-wider block mb-2">
                    {event.host.role}
                  </span>
                  <p className="text-sm text-[#736B66] leading-relaxed">
                    {event.host.bio}
                  </p>
                </div>
              </div>
            </section>

            {/* Venue & Architectural Mapping */}
            <section className="space-y-4">
              <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E2DDD5] shadow-sand-sm">
                <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                  <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
                    Destination & Access
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

          {/* Right Column: Sticky Ticket Checkout Card (4 cols) */}
          <div className="lg:col-span-4 sticky top-28 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2DDD5] shadow-sand-md">
              <div className="border-b border-[#E2DDD5] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#736B66] font-semibold block">
                  Select Admission
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-serif text-2xl font-medium text-[#2A2421]">
                    Reserve Passes
                  </h3>
                  <div className="text-right">
                    <span className="text-xs text-[#736B66] block">Starting at</span>
                    <span className="font-serif text-xl font-bold text-[#C85A40] tabular-nums">
                      ${event.pricing.startingPrice}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tier Selection */}
              <div className="space-y-3 mb-6">
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block">
                  Ticket Tier
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
                          ${tier.price}
                        </span>
                      </div>
                      <p className="text-xs text-[#736B66] mt-1 leading-relaxed">
                        {tier.description}
                      </p>
                      <span className="text-[11px] text-[#736B66]/80 mt-2 block tabular-nums">
                        {tier.available} passes remaining
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-2">
                  Number of Guests
                </label>
                <div className="flex items-center justify-between p-2 bg-[#F4F1EA] rounded-2xl border border-[#E2DDD5]">
                  <button
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
                    onClick={() => setQuantity((q) => Math.min(selectedTier.available, q + 1))}
                    disabled={quantity >= selectedTier.available}
                    className="w-10 h-10 rounded-xl bg-white border border-[#E2DDD5] flex items-center justify-center font-bold text-[#2A2421] hover:bg-[#E2DDD5]/50 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Inclusions summary */}
              <div className="mb-6 p-4 bg-[#F4F1EA]/60 rounded-2xl border border-[#E2DDD5]/70 space-y-2">
                <span className="text-xs font-semibold text-[#2A2421] block">Included with {selectedTier.name}:</span>
                {selectedTier.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#736B66]">
                    <Check className="w-3.5 h-3.5 text-[#C85A40] shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              {/* Price Calculation */}
              <div className="border-t border-[#E2DDD5] pt-4 mb-6 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#736B66] block">Total Amount</span>
                  <span className="text-xs text-[#736B66]">Taxes & Service Included</span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-3xl font-bold text-[#2A2421] tabular-nums">
                    ${totalPrice}
                  </span>
                </div>
              </div>

              {/* Book Action */}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={() => onBookTickets(event, selectedTier, quantity)}
              >
                Proceed to Checkout
              </Button>

              {/* Assurance Guarantee */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#736B66]">
                <ShieldCheck className="w-4 h-4 text-[#C85A40]" />
                <span>Instant confirmation · Digital pass issued</span>
              </div>
            </div>

            {/* Attendance Stat Box */}
            <div className="bg-[#EBE6DF]/50 rounded-2xl p-5 border border-[#E2DDD5] flex items-center justify-between text-xs text-[#736B66]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#C85A40]" />
                <span>Gathering Capacity</span>
              </div>
              <span className="font-semibold text-[#2A2421] tabular-nums">
                {event.attendeeCount} / {event.capacity} Filled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
