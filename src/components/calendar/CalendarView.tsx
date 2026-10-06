import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  Ticket,
  Search,
  X,
  Compass
} from 'lucide-react';
import { EventItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { EventArtwork } from '../ui/EventArtwork';
import { CategoryIcon } from '../ui/CategoryIcon';
import { CATEGORY_DEFINITIONS } from '../../data/categories';
import { formatKES } from '../../utils/format';

export interface CalendarViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onQuickBook: (event: EventItem) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (event: EventItem) => void;
  onShareEvent?: (event: EventItem) => void;
  initialCategory?: string;
}

type CalendarMode = 'month' | 'week';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onSelectEvent,
  onQuickBook,
  bookmarkedIds,
  onToggleBookmark,
  onShareEvent,
  initialCategory = 'all'
}) => {
  // Open on this month when it still has upcoming events, otherwise on the month of the next upcoming event
  const initialDate = useMemo(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const next = events
      .map((e) => e.isoDate)
      .filter((d) => d >= today)
      .sort()[0];
    if (next) {
      const [year, month] = next.split('-').map(Number);
      if (year && month) {
        return new Date(year, month - 1, 1);
      }
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [events]);

  const [currentDate, setCurrentDate] = useState<Date>(initialDate);
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDayString, setSelectedDayString] = useState<string | null>(null);

  // Filter events by category & search query
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedCategory !== 'all' && ev.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ev.title.toLowerCase().includes(q);
        const matchVenue = ev.venue.name.toLowerCase().includes(q) || ev.venue.city.toLowerCase().includes(q);
        const matchCat = ev.category.toLowerCase().includes(q);
        if (!matchTitle && !matchVenue && !matchCat) return false;
      }
      return true;
    });
  }, [events, selectedCategory, searchQuery]);

  // Group events by ISO Date string YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.isoDate]) {
        map[ev.isoDate] = [];
      }
      map[ev.isoDate].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Month navigation helpers
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleJumpToInitial = () => {
    setCurrentDate(initialDate);
    setSelectedDayString(null);
  };

  // Week navigation helpers
  const handlePrevWeek = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 7);
    setCurrentDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 7);
    setCurrentDate(next);
  };

  // Month grid calculation (Monday start)
  const monthGridData = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Day of week: 0 = Sun, 1 = Mon ... We want 0 = Mon, 6 = Sun
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Previous month padding days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    const prevDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 12 : currentMonth;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      prevDays.push({ day: d, dateStr, isCurrentMonth: false });
    }

    // Current month days
    const currentDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      currentDays.push({ day: d, dateStr, isCurrentMonth: true });
    }

    // Next month padding days to complete grid (total cells multiple of 7)
    const totalCells = prevDays.length + currentDays.length;
    const nextDaysNeeded = (7 - (totalCells % 7)) % 7;
    const nextDays: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];
    for (let d = 1; d <= nextDaysNeeded; d++) {
      const m = currentMonth === 11 ? 1 : currentMonth + 2;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      nextDays.push({ day: d, dateStr, isCurrentMonth: false });
    }

    return [...prevDays, ...currentDays, ...nextDays];
  }, [currentYear, currentMonth]);

  // Week view calculation: 7 days around currentDate
  const weekDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay(); // 0 = Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(currentDate);
    monday.setDate(currentDate.getDate() + mondayOffset);

    const days: { date: Date; dateStr: string; dayName: string; dayNumber: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;
      days.push({
        date: d,
        dateStr,
        dayName: DAYS_OF_WEEK[i],
        dayNumber: d.getDate()
      });
    }
    return days;
  }, [currentDate]);

  // Count events in the visible month
  const monthlyEventsCount = useMemo(() => {
    const prefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    return filteredEvents.filter((ev) => ev.isoDate.startsWith(prefix)).length;
  }, [filteredEvents, currentYear, currentMonth]);

  // Events for selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayString) return [];
    return eventsByDate[selectedDayString] || [];
  }, [selectedDayString, eventsByDate]);

  const monthName = currentDate.toLocaleString('en-KE', { month: 'long' });

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-500">
      {/* Top Header & Scheduling Control Bar */}
      <div className="bg-ivory rounded-3xl p-6 sm:p-8 border border-[#D8CDBC] shadow-sand-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D8CDBC] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5" />
                Event calendar
              </span>
              <span className="text-[#D8CDBC]">·</span>
              <span className="text-xs text-[#675A50]">
                {monthlyEventsCount} {monthlyEventsCount === 1 ? 'event' : 'events'} in {monthName}
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1814]">
              {calendarMode === 'month' ? `${monthName} ${currentYear}` : `Week of ${weekDays[0].date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`}
            </h2>
          </div>

          {/* View Mode Toggle & Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Month / Week Switcher */}
            <div className="bg-[#E9E2D6] p-1 rounded-2xl border border-[#D8CDBC] flex items-center">
              <button
                type="button"
                onClick={() => setCalendarMode('month')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  calendarMode === 'month'
                    ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold'
                    : 'text-[#675A50] hover:text-[#1E1814]'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  calendarMode === 'week'
                    ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold'
                    : 'text-[#675A50] hover:text-[#1E1814]'
                }`}
              >
                Week
              </button>
            </div>

            {/* Stepper Nav */}
            <div className="flex items-center gap-1 bg-ivory border border-[#D8CDBC] rounded-2xl p-1 shadow-xs">
              <button
                type="button"
                onClick={calendarMode === 'month' ? handlePrevMonth : handlePrevWeek}
                aria-label="Previous period"
                className="p-2 rounded-xl text-[#675A50] hover:text-[#1E1814] hover:bg-[#E9E2D6] transition-colors cursor-pointer"
                title={calendarMode === 'month' ? 'Previous Month' : 'Previous Week'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleJumpToInitial}
                className="px-2.5 py-1 text-xs text-[#1E1814] hover:bg-[#E9E2D6] rounded-lg font-medium transition-colors cursor-pointer"
                title="Jump to the next upcoming events"
              >
                Upcoming
              </button>
              <button
                type="button"
                onClick={calendarMode === 'month' ? handleNextMonth : handleNextWeek}
                aria-label="Next period"
                className="p-2 rounded-xl text-[#675A50] hover:text-[#1E1814] hover:bg-[#E9E2D6] transition-colors cursor-pointer"
                title={calendarMode === 'month' ? 'Next Month' : 'Next Week'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Row: Category Pills & Fast Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_DEFINITIONS.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none shrink-0 ${
                    isSelected
                      ? 'bg-[#8A4F33] text-white shadow-sand-sm'
                      : 'bg-[#E9E2D6] text-[#675A50] hover:bg-ivory hover:text-[#1E1814] border border-[#D8CDBC]'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CategoryIcon category={cat.id} className="w-3 h-3" />
                    {cat.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Field */}
          <div className="relative w-full lg:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#675A50]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, venue, town or category"
              aria-label="Search the calendar"
              className="w-full pl-9 pr-8 py-2 bg-[#E9E2D6] border border-[#D8CDBC] rounded-xl text-xs text-[#1E1814] placeholder-[#675A50] focus:outline-none focus:bg-ivory focus:border-[#8A4F33]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#675A50] hover:text-[#1E1814] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Calendar Body */}
      {calendarMode === 'month' ? (
        /* Monthly Calendar Grid */
        <div className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-[#D8CDBC] bg-[#EFE8DD] text-center">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="py-3 text-[11px] font-semibold text-[#675A50] uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Day Grid Cells */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#D8CDBC] border-b border-[#D8CDBC]">
            {monthGridData.map((cell, idx) => {
              const dayEvents = eventsByDate[cell.dateStr] || [];
              const hasEvents = dayEvents.length > 0;
              const isSelectedDay = selectedDayString === cell.dateStr;

              return (
                <div
                  key={`${cell.dateStr}-${idx}`}
                  onClick={() => {
                    setSelectedDayString(cell.dateStr);
                  }}
                  className={`min-h-[105px] sm:min-h-[125px] p-2 sm:p-2.5 transition-all flex flex-col justify-between cursor-pointer group relative ${
                    cell.isCurrentMonth
                      ? 'bg-ivory hover:bg-[#EFE8DD]'
                      : 'bg-[#EFE8DD]/60 text-[#675A50]/60'
                  } ${
                    isSelectedDay
                      ? 'ring-2 ring-[#8A4F33] bg-[#8A4F33]/5 z-10'
                      : ''
                  }`}
                >
                  {/* Date Number & Event Dots */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-mono font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                        hasEvents
                          ? 'bg-[#8A4F33] text-white font-bold'
                          : isSelectedDay
                          ? 'bg-[#1E1814] text-white'
                          : cell.isCurrentMonth
                          ? 'text-[#1E1814]'
                          : 'text-[#675A50]/60'
                      }`}
                    >
                      {cell.day}
                    </span>

                    {hasEvents && (
                      <span className="hidden sm:inline-block text-[10px] text-[#8A4F33] font-medium tracking-tight">
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                      </span>
                    )}
                  </div>

                  {/* Event Chips for Day */}
                  <div className="space-y-1 mt-1.5 flex-1">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev);
                        }}
                        className="p-1 sm:p-1.5 bg-[#EFE8DD] group-hover:bg-ivory hover:border-[#8A4F33] border border-[#D8CDBC] rounded-lg transition-all text-left shadow-2xs group/chip"
                        title={`${ev.title} (${ev.time})`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-serif text-[11px] font-medium text-[#1E1814] truncate group-hover/chip:text-[#8A4F33] leading-tight">
                            {ev.title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-[#675A50] mt-0.5">
                          <span className="font-mono text-[#8A4F33] truncate">
                            {ev.time.split('—')[0]}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {ev.isFree ? 'Free' : formatKES(ev.pricing.startingPrice)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-[#8A4F33] font-medium pl-1">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Weekly Schedule Column View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const dayEvents = eventsByDate[day.dateStr] || [];
              const isSelectedDay = selectedDayString === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDayString(day.dateStr)}
                  className={`bg-ivory rounded-2xl border p-4 transition-all cursor-pointer flex flex-col ${
                    isSelectedDay
                      ? 'border-[#8A4F33] shadow-sand-md ring-2 ring-[#8A4F33]/20 bg-[#EFE8DD]'
                      : 'border-[#D8CDBC] hover:border-[#675A50] shadow-sand-sm'
                  }`}
                >
                  {/* Column Day Header */}
                  <div className="border-b border-[#D8CDBC] pb-2.5 mb-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-[#675A50] uppercase tracking-wider block">
                        {day.dayName}
                      </span>
                      <span className="font-serif text-xl font-medium text-[#1E1814]">
                        {day.dayNumber}
                      </span>
                    </div>

                    {dayEvents.length > 0 ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#8A4F33]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D8CDBC]" />
                    )}
                  </div>

                  {/* Day Events List in Week View */}
                  <div className="space-y-2.5 flex-1">
                    {dayEvents.length > 0 ? (
                      dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(ev);
                          }}
                          className="p-2.5 bg-[#E9E2D6]/60 hover:bg-ivory border border-[#D8CDBC] hover:border-[#8A4F33] rounded-xl transition-all text-left shadow-2xs group"
                        >
                          <div className="aspect-video w-full rounded-lg overflow-hidden mb-2 bg-[#1E1814]">
                            <EventArtwork
                              imageUrl={ev.imageUrl}
                              title={ev.title}
                              category={ev.category}
                              imageClassName="group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>

                          <span className="text-[10px] font-semibold text-[#8A4F33] uppercase tracking-wider block">
                            {ev.category}
                          </span>
                          <h4 className="font-serif text-xs font-medium text-[#1E1814] mt-0.5 line-clamp-2 leading-tight group-hover:text-[#8A4F33] transition-colors">
                            {ev.title}
                          </h4>
                          <div className="flex items-center justify-between text-[10px] text-[#675A50] mt-2 pt-1 border-t border-[#D8CDBC]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#8A4F33]" />
                              {ev.time.split('—')[0]}
                            </span>
                            <span className="font-semibold text-[#1E1814] tabular-nums">
                              {ev.isFree ? 'Free' : formatKES(ev.pricing.startingPrice)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-24 flex items-center justify-center text-center text-[#675A50]/60 text-xs italic">
                        No events
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Schedule Inspector Section */}
      {selectedDayString && (
        <div className="bg-[#EFE8DD] rounded-3xl p-6 sm:p-8 border border-[#D8CDBC] shadow-sand-md space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-[#D8CDBC] pb-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold block">
                Day schedule
              </span>
              <h3 className="font-serif text-2xl font-medium text-[#1E1814] mt-0.5">
                Events on {new Date(selectedDayString + 'T00:00:00').toLocaleDateString('en-KE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDayString(null)}
              className="p-2 text-[#675A50] hover:text-[#1E1814] hover:bg-ivory rounded-full transition-colors cursor-pointer"
              title="Close day view"
              aria-label="Close day view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedDayEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedDayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-ivory rounded-2xl p-4 sm:p-5 border border-[#D8CDBC] shadow-sand-sm flex flex-col sm:flex-row gap-4 group"
                >
                  <div className="w-full sm:w-36 h-28 rounded-xl overflow-hidden bg-[#1E1814] shrink-0 relative">
                    <EventArtwork
                      imageUrl={ev.imageUrl}
                      title={ev.title}
                      category={ev.category}
                      imageClassName="group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge variant="terracotta" size="sm">
                        {ev.category}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-[#8A4F33] font-mono font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.time}
                        </span>
                        {ev.isFree ? (
                          <Badge variant="sage" size="sm">
                            Free
                          </Badge>
                        ) : (
                          <span className="text-xs text-[#1E1814] font-semibold tabular-nums">
                            From {formatKES(ev.pricing.startingPrice)}
                          </span>
                        )}
                      </div>

                      <h4
                        onClick={() => onSelectEvent(ev)}
                        className="font-serif text-base font-medium text-[#1E1814] mt-1 group-hover:text-[#8A4F33] transition-colors cursor-pointer"
                      >
                        {ev.title}
                      </h4>

                      <p className="text-xs text-[#675A50] mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#675A50]" />
                        {ev.venue.name}, {ev.venue.city}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#D8CDBC] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        {onShareEvent && (
                          <button
                            type="button"
                            onClick={() => onShareEvent(ev)}
                            title="Share event"
                            aria-label="Share event"
                            className="p-2 text-[#675A50] hover:text-[#8A4F33] hover:bg-[#E9E2D6] rounded-xl transition-colors cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleBookmark(ev)}
                          title="Save event"
                          aria-label={bookmarkedIds.includes(ev.id) ? 'Remove from saved' : 'Save event'}
                          className={`p-2 rounded-xl transition-colors cursor-pointer ${
                            bookmarkedIds.includes(ev.id)
                              ? 'text-[#8A4F33] bg-[#8A4F33]/10'
                              : 'text-[#675A50] hover:text-[#1E1814] hover:bg-[#E9E2D6]'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" fill={bookmarkedIds.includes(ev.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onSelectEvent(ev)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onQuickBook(ev)}
                          icon={<Ticket className="w-3.5 h-3.5" />}
                        >
                          {ev.isFree ? 'Register' : 'Book'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-ivory rounded-2xl border border-dashed border-[#D8CDBC] text-[#675A50] space-y-2">
              <Compass className="w-8 h-8 text-[#8A4F33]/60 mx-auto" />
              <p className="font-serif text-base text-[#1E1814]">
                No events on this date
              </p>
              <p className="text-xs text-[#675A50] max-w-md mx-auto">
                Try another day, or switch to the grid to see every upcoming event.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
