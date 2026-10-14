import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Users,
  Wallet,
  Ticket,
  PlusCircle,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  BadgePercent,
  CalendarDays,
  ScanLine,
  ShieldAlert
} from 'lucide-react';
import { EventItem } from '../../types';
import { Badge } from '../ui/Badge';
import { EventArtwork } from '../ui/EventArtwork';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { PromoCodesPanel } from './PromoCodesPanel';
import { CheckInPanel } from './CheckInPanel';

export interface OrganizerDashboardProps {
  events: EventItem[];
  onCreateEvent: () => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (eventId: string) => void;
  onViewEvent: (event: EventItem) => void;
  onToggleStatus: (eventId: string) => void;
  /** False for attendees, who must become organizers before managing events */
  isOrganizer: boolean;
  /** Set (possibly empty) when an admin has suspended this organizer; null otherwise */
  suspensionReason?: string | null;
  onBecomeOrganizer: () => void;
}

type DashboardSection = 'events' | 'promos' | 'checkin';

const SECTIONS: { id: DashboardSection; label: string; icon: React.ElementType }[] = [
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'promos', label: 'Promo codes', icon: BadgePercent },
  { id: 'checkin', label: 'Check-in', icon: ScanLine }
];

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  events,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onViewEvent,
  onToggleStatus,
  isOrganizer,
  suspensionReason = null,
  onBecomeOrganizer
}) => {
  const isSuspended = suspensionReason !== null;
  const [section, setSection] = useState<DashboardSection>('events');
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Computed statistics
  const stats = useMemo(() => {
    const totalEvents = events.length;
    // Confirmed bookings only; tickets held by unpaid bookings are not attendees yet
    const activeAttendees = events.reduce((acc, curr) => acc + (curr.organizerStats?.ticketsSold || 0), 0);
    // Sales come from the server, summed from the bookings actually made
    const grossRevenue = events.reduce((acc, curr) => acc + (curr.organizerStats?.revenue || 0), 0);
    const ticketsSold = events.reduce((acc, curr) => acc + (curr.organizerStats?.ticketsSold || 0), 0);

    return {
      totalEvents,
      activeAttendees,
      grossRevenue,
      ticketsSold
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (activeTab === 'all') return events;
    if (activeTab === 'published') return events.filter((e) => e.status === 'published');
    if (activeTab === 'draft') return events.filter((e) => e.status === 'draft');
    return events;
  }, [events, activeTab]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#D8CDBC]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold block mb-1">
            Organizer Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1814]">
            Organizer Dashboard
          </h1>
          <p className="text-sm text-[#675A50] mt-1">
            Create and manage your events, track registrations and publish updates.
          </p>
        </div>

        {isOrganizer && !isSuspended && (
          <Button
            variant="primary"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={onCreateEvent}
          >
            Create Event
          </Button>
        )}
      </div>

      {!isOrganizer ? (
        /* Attendees upgrade before they can manage events */
        <div className="my-10 bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm p-8 sm:p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#E9E2D6] flex items-center justify-center text-[#8A4F33] mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-medium text-[#1E1814] mb-2">Host your own events</h2>
          <p className="text-sm text-[#675A50] max-w-md mx-auto mb-6">
            Your account is an attendee account. Become an organizer to publish events, sell tickets and check
            attendees in.
          </p>
          <Button variant="primary" onClick={onBecomeOrganizer}>
            Become an organizer
          </Button>
        </div>
      ) : (
      <>
      {isSuspended && (
        <div role="status" className="mt-8 p-4 sm:p-5 rounded-2xl border border-amber-300 bg-amber-50 text-sm text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Your organizer account is suspended</p>
            <p className="text-xs mt-1 leading-relaxed">
              You can still see your events, sales and attendees, but you cannot create or publish events.
              {suspensionReason ? ` Reason: ${suspensionReason}` : ''} Contact MagiVents to have it reactivated.
            </p>
          </div>
        </div>
      )}
      {/* Section switcher */}
      <div role="tablist" aria-label="Dashboard sections" className="mt-8 bg-[#EFE8DD] p-1 rounded-2xl border border-[#D8CDBC] inline-flex items-center gap-1 shadow-xs overflow-x-auto max-w-full">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => setSection(id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
              section === id ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold' : 'text-[#675A50] hover:text-[#1E1814]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 text-[#8A4F33]" />
            {label}
          </button>
        ))}
      </div>

      {section === 'checkin' && <CheckInPanel events={events} />}

      {section === 'promos' && (
        <div className="my-8">
          <PromoCodesPanel events={events} />
        </div>
      )}

      {section === 'events' && (
      <>
      {/* Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <div className="bg-ivory rounded-3xl p-6 border border-[#D8CDBC] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#675A50] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <div className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#1E1814] tabular-nums">
            {stats.totalEvents}
          </div>
          <span className="text-xs text-[#675A50] mt-1 block">Created by you</span>
        </div>

        <div className="bg-ivory rounded-3xl p-6 border border-[#D8CDBC] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#675A50] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Attendees</span>
            <div className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#1E1814] tabular-nums">
            {stats.activeAttendees}
          </div>
          <span className="text-xs text-emerald-700 mt-1 block font-medium">
            Confirmed bookings
          </span>
        </div>

        <div className="bg-ivory rounded-3xl p-6 border border-[#D8CDBC] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#675A50] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Revenue</span>
            <div className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#1E1814] tabular-nums">
            {formatKES(stats.grossRevenue, null)}
          </div>
          <span className="text-xs text-[#675A50] mt-1 block">Paid by attendees, after discounts</span>
        </div>

        <div className="bg-ivory rounded-3xl p-6 border border-[#D8CDBC] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#675A50] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets Issued</span>
            <div className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33]">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#1E1814] tabular-nums">
            {stats.ticketsSold}
          </div>
          <span className="text-xs text-[#675A50] mt-1 block">Across all ticket types</span>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden mt-10">
        {/* Table/List Filter Tabs */}
        <div className="px-6 py-4 border-b border-[#D8CDBC] bg-[#E9E2D6]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#1E1814] text-white'
                  : 'text-[#675A50] hover:text-[#1E1814]'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'published'
                  ? 'bg-[#1E1814] text-white'
                  : 'text-[#675A50] hover:text-[#1E1814]'
              }`}
            >
              Published ({events.filter((e) => e.status === 'published').length})
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'draft'
                  ? 'bg-[#1E1814] text-white'
                  : 'text-[#675A50] hover:text-[#1E1814]'
              }`}
            >
              Drafts ({events.filter((e) => e.status === 'draft').length})
            </button>
          </div>

          <span className="text-xs text-[#675A50]">
            Showing {filteredEvents.length} items
          </span>
        </div>

        {/* Content: List or Empty State */}
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-[#D8CDBC]">
            {filteredEvents.map((event) => {
              const fillPercentage = Math.round(
                ((event.organizerStats?.ticketsSold || 0) / event.capacity) * 100
              );

              return (
                <div
                  key={event.id}
                  className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-[#E9E2D6]/20 transition-colors"
                >
                  {/* Event Meta & Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#D8CDBC] shrink-0">
                      <EventArtwork imageUrl={event.imageUrl} title={event.title} category={event.category} />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={event.status === 'published' ? 'terracotta' : 'sand'}
                          size="sm"
                        >
                          {event.status === 'published' ? 'Published' : event.status === 'sold_out' ? 'Sold Out' : 'Draft'}
                        </Badge>
                        {event.isFree && (
                          <Badge variant="sage" size="sm">
                            Free
                          </Badge>
                        )}
                        <span className="text-xs text-[#675A50] font-medium">
                          {event.category}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-medium text-[#1E1814]">
                        {event.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#675A50]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#8A4F33]" />
                          {event.date}
                        </span>
                        <span>·</span>
                        <span>{event.venue.name}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#1E1814] tabular-nums">
                          {event.isFree ? 'Free' : formatKES(event.pricing.startingPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Gauge */}
                  <div className="min-w-[140px] space-y-1.5">
                    <div className="flex justify-between text-xs text-[#675A50]">
                      <span>Attendees</span>
                      <span className="font-medium text-[#1E1814] tabular-nums">
                        {event.organizerStats?.ticketsSold ?? 0} / {event.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-[#D8CDBC] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#8A4F33] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, fillPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Inline Action Buttons: Edit, Delete, Toggle Status, View */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onViewEvent(event)}
                      title="View public event page"
                      className="p-2.5 rounded-full text-[#675A50] hover:text-[#1E1814] hover:bg-[#D8CDBC]/60 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleStatus(event.id)}
                      title={event.status === 'published' ? 'Switch to Draft' : 'Publish live'}
                      className="p-2.5 rounded-full text-[#675A50] hover:text-[#1E1814] hover:bg-[#D8CDBC]/60 transition-colors cursor-pointer"
                    >
                      {event.status === 'published' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-600" />
                      )}
                    </button>

                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => onEditEvent(event)}
                    >
                      Edit
                    </Button>

                    {deleteConfirmId === event.id ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            onDeleteEvent(event.id);
                            setDeleteConfirmId(null);
                          }}
                        >
                          Confirm
                        </Button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs text-[#675A50] hover:text-[#1E1814] px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(event.id)}
                        title="Delete event"
                        className="p-2.5 rounded-full text-[#675A50] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State for Organizer Inventory */
          <div className="py-20 px-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#E9E2D6] flex items-center justify-center text-[#8A4F33] mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#1E1814] mb-2">
              No events here yet
            </h3>
            <p className="text-sm text-[#675A50] max-w-md mx-auto mb-6">
              Events you create will appear here. Add the details, agenda and ticket price, and publish it for people across Kenya to find.
            </p>
            <Button
              variant="primary"
              size="md"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={onCreateEvent}
            >
              Create Your First Event
            </Button>
          </div>
        )}
      </div>
      </>
      )}
      </>
      )}
    </div>
  );
};
