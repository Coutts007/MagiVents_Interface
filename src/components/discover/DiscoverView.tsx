import React, { useState, useMemo } from 'react';
import { Search, X, SlidersHorizontal, Sparkles, RefreshCw, LayoutGrid, CalendarDays } from 'lucide-react';
import { EventItem, EventCategory } from '../../types';
import { HeroBanner } from './HeroBanner';
import { EventCard } from './EventCard';
import { CategoryFilterBar } from './CategoryFilterBar';
import { CalendarView } from '../calendar/CalendarView';
import { SkeletonGrid } from '../ui/SkeletonCard';
import { Button } from '../ui/Button';

export interface DiscoverViewProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onQuickBook: (event: EventItem) => void;
  bookmarkedIds: string[];
  onToggleBookmark: (event: EventItem) => void;
  initialCategory?: string;
  onShareEvent?: (event: EventItem) => void;
  currentTab?: 'grid' | 'calendar';
  onTabChange?: (tab: 'grid' | 'calendar') => void;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  events,
  onSelectEvent,
  onQuickBook,
  bookmarkedIds,
  onToggleBookmark,
  initialCategory = 'all',
  onShareEvent,
  currentTab,
  onTabChange,
  isLoading = false,
  onRefresh
}) => {
  const [internalTab, setInternalTab] = useState<'grid' | 'calendar'>('grid');
  const activeTab = currentTab || internalTab;

  const handleTabChange = (tab: 'grid' | 'calendar') => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedDateFilter, setSelectedDateFilter] = useState<'all' | '30days' | 'later'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price-asc' | 'price-desc'>('date');

  // Dynamic Category Counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach((event) => {
      counts[event.category] = (counts[event.category] || 0) + 1;
    });
    return counts;
  }, [events]);

  // Filter & Search Logic
  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        // Category Filter
        if (selectedCategory !== 'all' && event.category !== selectedCategory) {
          return false;
        }

        // Tag Filter
        if (selectedTag) {
          const hasTag = event.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
          if (!hasTag) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = event.title.toLowerCase().includes(q);
          const matchDesc = event.description.toLowerCase().includes(q);
          const matchVenue =
            event.venue.name.toLowerCase().includes(q) || event.venue.city.toLowerCase().includes(q);
          const matchHost = event.host.name.toLowerCase().includes(q);
          const matchTags = event.tags.some((t) => t.toLowerCase().includes(q));
          const matchCategory = event.category.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchVenue && !matchHost && !matchTags && !matchCategory) {
            return false;
          }
        }

        // Date filter
        if (selectedDateFilter === '30days') {
          if (event.isoDate > '2026-11-15') return false;
        } else if (selectedDateFilter === 'later') {
          if (event.isoDate < '2026-11-15') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') {
          return a.pricing.startingPrice - b.pricing.startingPrice;
        }
        if (sortBy === 'price-desc') {
          return b.pricing.startingPrice - a.pricing.startingPrice;
        }
        return a.isoDate.localeCompare(b.isoDate);
      });
  }, [events, selectedCategory, selectedTag, searchQuery, selectedDateFilter, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTag(null);
    setSelectedDateFilter('all');
    setSortBy('date');
  };

  return (
    <div className="w-full pb-24 animate-in fade-in duration-500">
      {/* Editorial Featured Carousel */}
      <HeroBanner
        events={events}
        onSelectEvent={onSelectEvent}
        onQuickBook={onQuickBook}
        onShare={onShareEvent}
      />

      {/* Discovery Catalog Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-[#E2DDD5]">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#736B66] font-semibold flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C85A40]" />
              Curated Event Directory
            </span>
            <h2
              style={{ textWrap: 'balance' }}
              className="font-serif text-3xl sm:text-4xl font-medium text-[#2A2421]"
            >
              Explore Gatherings of Mind & Craft
            </h2>
          </div>

          {/* Segmented View Mode Tabs & Shimmer Simulation */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Segmented Tab: Directory Grid vs Calendar Schedule */}
            <div className="bg-[#FAF8F5] p-1 rounded-2xl border border-[#E2DDD5] flex items-center shadow-xs">
              <button
                type="button"
                onClick={() => handleTabChange('grid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  activeTab === 'grid'
                    ? 'bg-white text-[#2A2421] shadow-sand-sm font-semibold'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-[#C85A40]" />
                <span>Directory Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('calendar')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                  activeTab === 'calendar'
                    ? 'bg-white text-[#2A2421] shadow-sand-sm font-semibold'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 text-[#C85A40]" />
                <span>Calendar Schedule</span>
              </button>
            </div>

            {activeTab === 'grid' && (
              <Button
                variant="secondary"
                size="sm"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
                onClick={onRefresh}
                disabled={isLoading || !onRefresh}
                title="Reload gatherings from the server"
              >
                Refresh
              </Button>
            )}
          </div>
        </div>

        {/* View Mode Content: CalendarView vs Directory Grid */}
        {activeTab === 'calendar' ? (
          <div className="pt-6">
            <CalendarView
              events={events}
              onSelectEvent={onSelectEvent}
              onQuickBook={onQuickBook}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={onToggleBookmark}
              onShareEvent={onShareEvent}
              initialCategory={selectedCategory}
            />
          </div>
        ) : (
          <div>

        {/* Filter Toolbar & Category Navigation */}
        <div className="py-6 space-y-5">
          {/* Dedicated Category Filter Bar with Counts and Curatorial Descriptions */}
          <CategoryFilterBar
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedTag(null);
            }}
            categoryCounts={categoryCounts}
            activeTag={selectedTag || undefined}
            onClearTag={() => setSelectedTag(null)}
          />

          {/* Search & Sort Toolbar */}
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between pt-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#736B66]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search artists, culinary feasts, architecture or venues..."
                className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#E2DDD5] rounded-full text-sm text-[#2A2421] placeholder-[#736B66]/70 focus:outline-none focus:border-[#C85A40] focus:ring-1 focus:ring-[#C85A40] transition-colors shadow-sand-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-[#736B66] hover:text-[#2A2421] rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Sort & Time Window Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-[#736B66]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-medium">Sort:</span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-[#E2DDD5] rounded-full px-4 py-2 text-xs font-medium text-[#2A2421] focus:outline-none focus:border-[#C85A40] cursor-pointer shadow-sand-sm"
              >
                <option value="date">Date: Soonest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>

              <div className="flex items-center bg-white border border-[#E2DDD5] rounded-full p-1 shadow-sand-sm">
                <button
                  onClick={() => setSelectedDateFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedDateFilter === 'all'
                      ? 'bg-[#2A2421] text-white'
                      : 'text-[#736B66] hover:text-[#2A2421]'
                  }`}
                >
                  All Dates
                </button>
                <button
                  onClick={() => setSelectedDateFilter('30days')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedDateFilter === '30days'
                      ? 'bg-[#2A2421] text-white'
                      : 'text-[#736B66] hover:text-[#2A2421]'
                  }`}
                >
                  Next 30 Days
                </button>
                <button
                  onClick={() => setSelectedDateFilter('later')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    selectedDateFilter === 'later'
                      ? 'bg-[#2A2421] text-white'
                      : 'text-[#736B66] hover:text-[#2A2421]'
                  }`}
                >
                  Winter 2026
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Display: Loading Skeleton vs Event Grid vs Empty State */}
        {isLoading ? (
          <div className="py-6">
            <SkeletonGrid count={6} />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onSelect={onSelectEvent}
                  isBookmarked={bookmarkedIds.includes(event.id)}
                  onToggleBookmark={onToggleBookmark}
                  onShare={onShareEvent}
                  onCategoryClick={(cat) => {
                    setSelectedCategory(cat);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Empty Search/Filter State */
          <div className="py-20 text-center bg-white rounded-3xl border border-[#E2DDD5] p-8 sm:p-12 shadow-sand-sm my-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#736B66] mb-4">
              <Search className="w-8 h-8 text-[#C85A40]" />
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#2A2421] mb-2">
              No gatherings match your criteria
            </h3>
            <p className="text-sm text-[#736B66] max-w-md mx-auto mb-6">
              We couldn't find any events in {selectedCategory !== 'all' ? `"${selectedCategory}"` : 'the catalog'} matching your query. Try broadening your terms or reset the filters.
            </p>
            <Button variant="primary" onClick={resetFilters}>
              Reset All Filters
            </Button>
          </div>
        )}
      </div>
    )}
  </section>

      {/* Curatorial Values / Manifesto Strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="bg-[#EBE6DF]/70 rounded-3xl p-8 sm:p-12 border border-[#E2DDD5] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl">
            <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold">
              The MagiVents Standard
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-2 mb-3">
              Intimacy, Materiality, and Acoustic Integrity
            </h3>
            <p className="text-sm text-[#736B66] leading-relaxed">
              Every gathering in our catalogue is vetted for sensory quality. We limit capacity to preserve conversation, select venues with natural architectural resonance, and partner with creators devoted to deliberate craftsmanship.
            </p>
          </div>
          <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
            <div className="text-center px-4 py-2 border-r border-[#E2DDD5]/80 last:border-none">
              <span className="font-serif text-3xl font-medium text-[#2A2421] block tabular-nums">180</span>
              <span className="text-xs text-[#736B66] uppercase tracking-wider">Max Capacity</span>
            </div>
            <div className="text-center px-4 py-2 border-r border-[#E2DDD5]/80 last:border-none">
              <span className="font-serif text-3xl font-medium text-[#2A2421] block tabular-nums">100%</span>
              <span className="text-xs text-[#736B66] uppercase tracking-wider">Acoustic Pure</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
