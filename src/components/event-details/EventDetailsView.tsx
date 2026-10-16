import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  MapPin,
  Share2,
  Bookmark,
  Check,
  Info,
  ShieldCheck,
  Users,
  Zap
} from 'lucide-react';
import { EventItem, TicketTier } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { EventArtwork } from '../ui/EventArtwork';
import { formatKES, normalizeWebsiteUrl, websiteHost } from '../../utils/format';
import { admitsLabel, saleSecondsLeft, saleSecondsUntilStart, tierPriceAt, tierSalesState } from '../../utils/tiers';
import { formatDuration, formatNairobiDateTime } from '../../utils/time';
import { useNow } from '../../utils/useNow';
import { LocationMap } from './LocationMap';

export interface EventDetailsViewProps {
  event: EventItem;
  onBack: () => void;
  onBookTickets: (event: EventItem, tier: TicketTier, quantity: number) => void;
  isBookmarked: boolean;
  onToggleBookmark: (event: EventItem) => void;
  onSelectCategory?: (category: any) => void;
  onShare?: (event: EventItem) => void;
  /** Shows every event with this tag on Discover */
  onSelectTag?: (tag: string) => void;
}

export const EventDetailsView: React.FC<EventDetailsViewProps> = ({
  event,
  onBack,
  onBookTickets,
  isBookmarked,
  onToggleBookmark,
  onSelectCategory,
  onShare,
  onSelectTag
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

  // Ticks every second while any flash sale is running or about to start, so prices and countdowns stay live
  const hasSales = event.pricing.tiers.some((t) => t.salePrice !== null && t.salePrice !== undefined);
  const now = useNow(hasSales && !event.isFree);
  // Only http(s) links are shown, whatever the stored value
  const websiteUrl = normalizeWebsiteUrl(event.websiteUrl);
  const selectedPrice = event.isFree ? { price: 0, onSale: false } : tierPriceAt(selectedTier, now);
  const admitsPerTicket = selectedTier.admits || 1;
  const totalPrice = selectedPrice.price * quantity;
  const placesLeft = Math.max(0, event.capacity - event.attendeeCount);
  // A couple or group ticket uses several places, so fewer tickets may fit than the tier has left
  const maxTickets = Math.max(
    0,
    Math.min(
      selectedTier.available,
      Math.floor(placesLeft / admitsPerTicket),
      selectedPrice.onSale && typeof selectedTier.saleRemaining === 'number' ? selectedTier.saleRemaining : Infinity
    )
  );
  const salesState = tierSalesState(selectedTier, now);
  const isSoldOut = event.status === 'sold_out' || placesLeft === 0 || maxTickets < 1;
  const cannotBook = isSoldOut || salesState !== 'on_sale';

  // Keep the quantity possible when the sale allowance or availability changes
  useEffect(() => {
    if (maxTickets > 0 && quantity > maxTickets) setQuantity(maxTickets);
  }, [maxTickets, quantity]);
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
          className="inline-flex items-center gap-2 text-sm font-medium text-[#675A50] hover:text-[#1E1814] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to all events</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            aria-label="Share event"
            className="p-2.5 rounded-full bg-ivory border border-[#D8CDBC] text-[#675A50] hover:text-[#1E1814] hover:bg-[#E9E2D6] transition-colors cursor-pointer shadow-sand-sm relative"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            {copiedShare && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1E1814] text-white text-[11px] px-2 py-0.5 rounded whitespace-nowrap">
                Link copied
              </span>
            )}
          </button>

          <button
            onClick={() => onToggleBookmark(event)}
            aria-label={isBookmarked ? 'Remove from saved' : 'Save event'}
            className={`p-2.5 rounded-full border border-[#D8CDBC] transition-colors cursor-pointer shadow-sand-sm ${
              isBookmarked
                ? 'bg-[#8A4F33] text-white border-[#8A4F33]'
                : 'bg-ivory text-[#675A50] hover:text-[#1E1814] hover:bg-[#E9E2D6]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Hero header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
        <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-3xl overflow-hidden shadow-sand-lg border border-[#D8CDBC] bg-[#1E1814]">
          <EventArtwork imageUrl={event.imageUrl} title={event.title} category={event.category} />

          {/* Scrim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#140F0C]/95 via-[#140F0C]/45 to-transparent" />

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
                <span className="text-xs uppercase tracking-widest text-[#F3E9DE]/80 font-medium">
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
                className="font-serif text-3xl sm:text-5xl md:text-5xl font-medium text-[#F3E9DE] tracking-tight leading-[1.15]"
              >
                {event.title}
              </h1>

              <p className="text-base sm:text-xl text-[#F3E9DE]/85 font-light max-w-2xl">
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
            <div className="bg-ivory rounded-3xl p-6 sm:p-8 border border-[#D8CDBC] shadow-sand-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#E9E2D6] text-[#8A4F33]">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                    Date
                  </span>
                  <span className="font-serif text-base text-[#1E1814] font-medium block mt-0.5">
                    {event.date}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#E9E2D6] text-[#8A4F33]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                    Schedule
                  </span>
                  <span className="font-serif text-base text-[#1E1814] font-medium block mt-0.5">
                    {event.time}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#E9E2D6] text-[#8A4F33]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                    Location
                  </span>
                  <span className="font-serif text-base text-[#1E1814] font-medium block mt-0.5 truncate max-w-[180px]">
                    {location || event.venue.name}
                  </span>
                </div>
              </div>
            </div>

            {/* About section */}
            <section className="bg-ivory rounded-3xl p-8 sm:p-10 border border-[#D8CDBC] shadow-sand-sm space-y-6">
              <div className="border-b border-[#D8CDBC] pb-4">
                <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold">
                  About
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1814] mt-1">
                  About this event
                </h2>
              </div>

              <div className="prose text-[#1E1814] leading-relaxed space-y-4 font-sans text-base">
                <p className="whitespace-pre-line">
                  {event.fullContent || event.description}
                </p>
                {event.fullContent && event.description && event.description !== event.fullContent && (
                  <p className="text-[#675A50] whitespace-pre-line">
                    {event.description}
                  </p>
                )}
              </div>

              {event.curatorNote?.trim() && (
                <div className="p-4 rounded-2xl bg-[#E9E2D6] border border-[#D8CDBC] flex items-start gap-3 text-xs sm:text-sm text-[#675A50]">
                  <Info className="w-5 h-5 text-[#8A4F33] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#1E1814] block">Note from the organizer</span>
                    {event.curatorNote}
                  </div>
                </div>
              )}

              {/* Tags */}
              {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {event.tags.map((tag) =>
                  onSelectTag ? (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onSelectTag(tag)}
                      title={`Show events tagged #${tag}`}
                      className="text-xs text-[#675A50] bg-[#E9E2D6] px-3 py-1 rounded-full border border-[#D8CDBC] hover:border-[#8A4F33] hover:text-[#8A4F33] transition-colors cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ) : (
                    <span
                      key={tag}
                      className="text-xs text-[#675A50] bg-[#E9E2D6] px-3 py-1 rounded-full border border-[#D8CDBC]"
                    >
                      #{tag}
                    </span>
                  )
                )}
              </div>
              )}
            </section>

            {/* Agenda set by the organizer; hidden when there is none */}
            {event.agenda.length > 0 && (
            <section className="bg-ivory rounded-3xl p-8 sm:p-10 border border-[#D8CDBC] shadow-sand-sm">
              <div className="border-b border-[#D8CDBC] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold">
                  Programme
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1814] mt-1">
                  Agenda
                </h2>
              </div>

              <div className="space-y-6">
                {event.agenda.map((item, index) => (
                  <div key={index} className="flex items-start gap-6 group">
                    <div className="shrink-0 w-20 text-right">
                      <span className="font-mono text-xs font-semibold text-[#8A4F33] tracking-wider block">
                        {item.time}
                      </span>
                    </div>

                    <div className="relative pl-6 pb-6 border-l-2 border-[#D8CDBC] group-last:border-transparent flex-1">
                      {/* Timeline dot */}
                      <span className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-ivory border-2 border-[#8A4F33]" />
                      <h4 className="font-serif text-lg font-medium text-[#1E1814]">
                        {item.title}
                      </h4>
                      {item.detail && (
                        <p className="text-sm text-[#675A50] mt-1 leading-relaxed">
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
            <section className="bg-ivory rounded-3xl p-8 sm:p-10 border border-[#D8CDBC] shadow-sand-sm">
              <div className="border-b border-[#D8CDBC] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold">
                  Organizer
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1814] mt-1">
                  Presented by {event.host.name}
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                <Avatar
                  name={event.host.name}
                  src={event.host.avatarUrl}
                  size="xl"
                  className="border-2 border-[#D8CDBC] shadow-sand-sm"
                />
                <div>
                  <h4 className="font-serif text-xl font-medium text-[#1E1814]">
                    {event.host.name}
                  </h4>
                  {event.host.role && (
                    <span className="text-xs font-medium text-[#8A4F33] uppercase tracking-wider block mb-2">
                      {event.host.role}
                    </span>
                  )}
                  {event.host.bio && (
                    <p className="text-sm text-[#675A50] leading-relaxed">
                      {event.host.bio}
                    </p>
                  )}
                  {websiteUrl && (
                    <a
                      href={websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="mt-4 inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-full border border-[#8A4F33] text-[#8A4F33] hover:bg-[#8A4F33] hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-[#8A4F33]"
                    >
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      Visit website
                      <span className="text-xs opacity-80">({websiteHost(websiteUrl)})</span>
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            </section>

            {/* Venue and map */}
            <section className="space-y-4">
              <div className="bg-ivory rounded-3xl p-8 sm:p-10 border border-[#D8CDBC] shadow-sand-sm">
                <div className="border-b border-[#D8CDBC] pb-4 mb-6">
                  <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold">
                    Venue
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1814] mt-1">
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
            <div className="bg-ivory rounded-3xl p-6 sm:p-8 border border-[#D8CDBC] shadow-sand-md">
              <div className="border-b border-[#D8CDBC] pb-4 mb-6">
                <span className="text-xs uppercase tracking-widest text-[#675A50] font-semibold block">
                  Tickets
                </span>
                <div className="flex items-baseline justify-between mt-1">
                  <h3 className="font-serif text-2xl font-medium text-[#1E1814]">
                    {event.isFree ? 'Register' : 'Book tickets'}
                  </h3>
                  <div className="text-right">
                    {event.isFree ? (
                      <span className="font-serif text-xl font-bold text-emerald-700">Free</span>
                    ) : (
                      <>
                        <span className="text-xs text-[#675A50] block">From</span>
                        <span className="font-serif text-xl font-bold text-[#8A4F33] tabular-nums">
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
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block">
                  Ticket type
                </label>
                <div role="radiogroup" aria-label="Ticket type" className="space-y-3">
                {event.pricing.tiers.map((tier) => {
                  const isSelected = selectedTier.id === tier.id;
                  const { price, onSale } = event.isFree ? { price: 0, onSale: false } : tierPriceAt(tier, now);
                  const endsIn = event.isFree ? null : saleSecondsLeft(tier, now);
                  const startsIn = event.isFree ? null : saleSecondsUntilStart(tier, now);
                  const state = tierSalesState(tier, now);
                  const admits = tier.admits || 1;
                  return (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      key={tier.id}
                      onClick={() => setSelectedTier(tier)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A4F33] ${
                        isSelected
                          ? 'border-[#8A4F33] bg-[#8A4F33]/5 shadow-sand-sm'
                          : 'border-[#D8CDBC] hover:border-[#675A50] bg-ivory'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-[#1E1814] text-sm">
                          {tier.name}
                          {admits > 1 && (
                            <span className="block text-[11px] font-normal text-[#8A4F33] mt-0.5">
                              {admitsLabel(admits)} · one ticket
                            </span>
                          )}
                        </span>
                        <span className="text-right shrink-0">
                          {onSale && (
                            <s className="block text-[11px] text-[#675A50] tabular-nums" aria-label={`Normal price ${formatKES(tier.price)}`}>
                              {formatKES(tier.price)}
                            </s>
                          )}
                          <span className={`font-serif font-bold tabular-nums ${onSale ? 'text-[#8A4F33]' : 'text-[#1E1814]'}`}>
                            {event.isFree ? 'Free' : formatKES(price)}
                          </span>
                        </span>
                      </div>
                      {onSale && endsIn !== null && (
                        <span className="mt-2 flex items-start gap-1.5 rounded-xl bg-brand-gold/90 text-[#1E1814] px-2.5 py-1 text-[11px] leading-snug">
                          <Zap className="w-3 h-3 mt-0.5 shrink-0" aria-hidden="true" />
                          <span>
                            <strong className="uppercase tracking-wider text-[10px]">Flash sale</strong> · ends in{' '}
                            <span className="tabular-nums font-semibold">{formatDuration(endsIn)}</span>
                            {typeof tier.saleRemaining === 'number' && ` · ${tier.saleRemaining} left at this price`}
                          </span>
                        </span>
                      )}
                      {!onSale && startsIn !== null && tier.salePrice !== null && tier.salePrice !== undefined && (
                        <span className="mt-2 block text-[11px] text-[#8A4F33]">
                          Flash sale at {formatKES(tier.salePrice)} from {formatNairobiDateTime(tier.saleStartsAt)} (Nairobi time)
                        </span>
                      )}
                      {tier.description && (
                        <p className="text-xs text-[#675A50] mt-1 leading-relaxed">
                          {tier.description}
                        </p>
                      )}
                      <span className="text-[11px] text-[#675A50]/80 mt-2 block tabular-nums">
                        {state === 'not_started'
                          ? `On sale from ${formatNairobiDateTime(tier.onSaleFrom)}`
                          : state === 'ended'
                            ? 'Sales closed'
                            : tier.available > 0
                              ? `${tier.available} left${tier.onSaleUntil ? ` · until ${formatNairobiDateTime(tier.onSaleUntil)}` : ''}`
                              : 'Sold out'}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>
              )}

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-2">
                  Number of tickets
                </label>
                <div className="flex items-center justify-between p-2 bg-[#E9E2D6] rounded-2xl border border-[#D8CDBC]">
                  <button
                    type="button"
                    aria-label="Fewer tickets"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 rounded-xl bg-ivory border border-[#D8CDBC] flex items-center justify-center font-bold text-[#1E1814] hover:bg-[#D8CDBC]/50 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-serif text-lg font-medium text-[#1E1814] tabular-nums">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="More tickets"
                    onClick={() => setQuantity((q) => Math.min(maxTickets, q + 1))}
                    disabled={quantity >= maxTickets}
                    className="w-10 h-10 rounded-xl bg-ivory border border-[#D8CDBC] flex items-center justify-center font-bold text-[#1E1814] hover:bg-[#D8CDBC]/50 disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Inclusions summary */}
              {selectedTier.perks.length > 0 && (
              <div className="mb-6 p-4 bg-[#E9E2D6]/60 rounded-2xl border border-[#D8CDBC]/70 space-y-2">
                <span className="text-xs font-semibold text-[#1E1814] block">Included with {selectedTier.name}:</span>
                {selectedTier.perks.map((perk, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-[#675A50]">
                    <Check className="w-3.5 h-3.5 text-[#8A4F33] shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
              )}

              {/* Price Calculation */}
              <div className="border-t border-[#D8CDBC] pt-4 mb-6 flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-[#675A50] block">Total</span>
                  <span className="text-[11px] text-[#675A50] block">
                    {admitsLabel(quantity * admitsPerTicket)}
                    {selectedPrice.onSale ? ' · sale price' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-3xl font-bold text-[#1E1814] tabular-nums">
                    {formatKES(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Book Action */}
              <Button
                variant="primary"
                fullWidth
                size="lg"
                disabled={cannotBook}
                onClick={() => onBookTickets(event, selectedTier, quantity)}
              >
                {isSoldOut
                  ? 'Sold out'
                  : salesState === 'not_started'
                    ? 'Not on sale yet'
                    : salesState === 'ended'
                      ? 'Sales closed'
                      : event.isFree
                        ? 'Register for free'
                        : 'Proceed to checkout'}
              </Button>

              {/* Assurance Guarantee */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#675A50]">
                <ShieldCheck className="w-4 h-4 text-[#8A4F33]" />
                <span>
                  {event.isFree ? 'Instant confirmation · Digital ticket issued' : 'Pay with M-Pesa · Digital ticket issued'}
                </span>
              </div>
            </div>

            {/* Attendance Stat Box */}
            <div className="bg-[#DFD6C8]/50 rounded-2xl p-5 border border-[#D8CDBC] flex items-center justify-between text-xs text-[#675A50]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#8A4F33]" />
                <span>Capacity</span>
              </div>
              <span className="font-semibold text-[#1E1814] tabular-nums">
                {event.attendeeCount} / {event.capacity} booked
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
