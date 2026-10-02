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
  Layers
} from 'lucide-react';
import { EventItem } from '../../types';
import { Badge } from '../ui/Badge';
import { EventArtwork } from '../ui/EventArtwork';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';

export interface OrganizerDashboardProps {
  events: EventItem[];
  onCreateEvent: () => void;
  onEditEvent: (event: EventItem) => void;
  onDeleteEvent: (eventId: string) => void;
  onViewEvent: (event: EventItem) => void;
  onToggleStatus: (eventId: string) => void;
}

export const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({
  events,
  onCreateEvent,
  onEditEvent,
  onDeleteEvent,
  onViewEvent,
  onToggleStatus
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'draft'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Computed statistics
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const activeAttendees = events.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);
    const grossRevenue = events.reduce((acc, curr) => {
      // Estimate: free events earn nothing; paid ones use their starting price
      const price = curr.isFree ? 0 : curr.pricing.startingPrice || 0;
      return acc + (curr.attendeeCount || 0) * price;
    }, 0);
    const ticketsSold = activeAttendees;

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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-[#E2DDD5]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold block mb-1">
            Organizer Portal
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#2A2421]">
            Organizer Dashboard
          </h1>
          <p className="text-sm text-[#736B66] mt-1">
            Create and manage your events, track registrations and publish updates.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={onCreateEvent}
        >
          Create Event
        </Button>
      </div>

      {/* Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8">
        <div className="bg-white rounded-3xl p-6 border border-[#E2DDD5] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#736B66] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Events</span>
            <div className="p-2 rounded-xl bg-[#F4F1EA] text-[#C85A40]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#2A2421] tabular-nums">
            {stats.totalEvents}
          </div>
          <span className="text-xs text-[#736B66] mt-1 block">Created by you</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E2DDD5] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#736B66] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Attendees</span>
            <div className="p-2 rounded-xl bg-[#F4F1EA] text-[#C85A40]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#2A2421] tabular-nums">
            {stats.activeAttendees}
          </div>
          <span className="text-xs text-emerald-700 mt-1 block font-medium">
            Confirmed bookings
          </span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E2DDD5] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#736B66] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Estimated Revenue</span>
            <div className="p-2 rounded-xl bg-[#F4F1EA] text-[#C85A40]">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#2A2421] tabular-nums">
            {formatKES(stats.grossRevenue, null)}
          </div>
          <span className="text-xs text-[#736B66] mt-1 block">Bookings × ticket price</span>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-[#E2DDD5] shadow-sand-sm">
          <div className="flex items-center justify-between text-[#736B66] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Tickets Issued</span>
            <div className="p-2 rounded-xl bg-[#F4F1EA] text-[#C85A40]">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-3xl font-medium text-[#2A2421] tabular-nums">
            {stats.ticketsSold}
          </div>
          <span className="text-xs text-[#736B66] mt-1 block">Across all ticket types</span>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="bg-white rounded-3xl border border-[#E2DDD5] shadow-sand-sm overflow-hidden mt-10">
        {/* Table/List Filter Tabs */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] bg-[#F4F1EA]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#2A2421] text-white'
                  : 'text-[#736B66] hover:text-[#2A2421]'
              }`}
            >
              All Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab('published')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'published'
                  ? 'bg-[#2A2421] text-white'
                  : 'text-[#736B66] hover:text-[#2A2421]'
              }`}
            >
              Published ({events.filter((e) => e.status === 'published').length})
            </button>
            <button
              onClick={() => setActiveTab('draft')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'draft'
                  ? 'bg-[#2A2421] text-white'
                  : 'text-[#736B66] hover:text-[#2A2421]'
              }`}
            >
              Drafts ({events.filter((e) => e.status === 'draft').length})
            </button>
          </div>

          <span className="text-xs text-[#736B66]">
            Showing {filteredEvents.length} items
          </span>
        </div>

        {/* Content: List or Empty State */}
        {filteredEvents.length > 0 ? (
          <div className="divide-y divide-[#E2DDD5]">
            {filteredEvents.map((event) => {
              const fillPercentage = Math.round(
                ((event.attendeeCount || 0) / event.capacity) * 100
              );

              return (
                <div
                  key={event.id}
                  className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-[#F4F1EA]/20 transition-colors"
                >
                  {/* Event Meta & Info */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-[#E2DDD5] shrink-0">
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
                        <span className="text-xs text-[#736B66] font-medium">
                          {event.category}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-medium text-[#2A2421]">
                        {event.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#736B66]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#C85A40]" />
                          {event.date}
                        </span>
                        <span>·</span>
                        <span>{event.venue.name}</span>
                        <span>·</span>
                        <span className="font-semibold text-[#2A2421] tabular-nums">
                          {event.isFree ? 'Free' : formatKES(event.pricing.startingPrice)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Attendance Gauge */}
                  <div className="min-w-[140px] space-y-1.5">
                    <div className="flex justify-between text-xs text-[#736B66]">
                      <span>Attendees</span>
                      <span className="font-medium text-[#2A2421] tabular-nums">
                        {event.attendeeCount} / {event.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-[#E2DDD5] h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-[#C85A40] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, fillPercentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Inline Action Buttons: Edit, Delete, Toggle Status, View */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onViewEvent(event)}
                      title="View public event page"
                      className="p-2.5 rounded-full text-[#736B66] hover:text-[#2A2421] hover:bg-[#E2DDD5]/60 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onToggleStatus(event.id)}
                      title={event.status === 'published' ? 'Switch to Draft' : 'Publish live'}
                      className="p-2.5 rounded-full text-[#736B66] hover:text-[#2A2421] hover:bg-[#E2DDD5]/60 transition-colors cursor-pointer"
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
                          className="text-xs text-[#736B66] hover:text-[#2A2421] px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(event.id)}
                        title="Delete event"
                        className="p-2.5 rounded-full text-[#736B66] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
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
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#C85A40] mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#2A2421] mb-2">
              No events here yet
            </h3>
            <p className="text-sm text-[#736B66] max-w-md mx-auto mb-6">
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
    </div>
  );
};
