import React, { useState, useEffect } from 'react';
import { EventItem, TicketTier, TicketBooking } from './types';
import { AuthModalMode } from './types/auth';
import { INITIAL_EVENTS } from './data/mockEvents';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/navigation/Navbar';
import { DiscoverView } from './components/discover/DiscoverView';
import { EventDetailsView } from './components/event-details/EventDetailsView';
import { OrganizerDashboard } from './components/organizer/OrganizerDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { EventEditorModal } from './components/organizer/EventEditorModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { AuthModal } from './components/auth/AuthModal';
import { BookmarksDrawer } from './components/bookmarks/BookmarksDrawer';
import { ShareModal } from './components/share/ShareModal';
import { Footer } from './components/common/Footer';

const STORAGE_EVENTS_KEY = 'magivents_events_v3';
const STORAGE_BOOKMARKS_KEY = 'magivents_bookmarks_v3';
const STORAGE_BOOKINGS_KEY = 'magivents_bookings_v3';

const INITIAL_BOOKINGS: TicketBooking[] = [
  {
    id: 'booking-seed-1',
    eventId: 'symphony-in-the-quarry',
    eventTitle: 'Symphony in the Quarry: Nocturne & Strings',
    eventDate: 'Saturday, Oct 24, 2026',
    eventTime: '19:00 — 22:30',
    venueName: 'St. Claire Stone Quarry Pavilion',
    tierName: 'Patron Circle',
    quantity: 2,
    unitPrice: 165,
    totalPrice: 330,
    attendeeName: 'Elena Rostova',
    attendeeEmail: 'elena.rostova@atelier.com',
    bookingDate: 'Oct 14, 2026',
    ticketCode: 'MV-849201'
  }
];

function MainLayout() {
  const { user } = useAuth();

  // Master events state
  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_EVENTS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read events from storage', e);
    }
    return INITIAL_EVENTS;
  });

  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BOOKMARKS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read bookmarks', e);
    }
    return [INITIAL_EVENTS[0].id, INITIAL_EVENTS[1].id];
  });

  const [bookings, setBookings] = useState<TicketBooking[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_BOOKINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read bookings', e);
    }
    return INITIAL_BOOKINGS;
  });

  // Navigation State: 'discover' | 'details' | 'organizer' | 'profile'
  const [currentView, setCurrentView] = useState<'discover' | 'details' | 'organizer' | 'profile'>('discover');
  const [discoverTab, setDiscoverTab] = useState<'grid' | 'calendar'>('grid');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutTarget, setCheckoutTarget] = useState<{
    event: EventItem | null;
    tier: TicketTier | null;
    quantity: number;
  }>({ event: null, tier: null, quantity: 1 });

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

  // Social Sharing Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareTargetEvent, setShareTargetEvent] = useState<EventItem | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  // Deep linking: Sync ?event=<id> from URL on initial load and popstate
  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const eventId = params.get('event');
        if (eventId) {
          const match = events.find((e) => e.id === eventId);
          if (match) {
            setSelectedEventId(match.id);
            setCurrentView('details');
          }
        }
      } catch (e) {
        console.warn('Could not inspect search params', e);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, [events]);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_EVENTS_KEY, JSON.stringify(events));
    } catch (e) {
      console.warn('Could not save events', e);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(bookmarkedIds));
    } catch (e) {
      console.warn('Could not save bookmarks', e);
    }
  }, [bookmarkedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(bookings));
    } catch (e) {
      console.warn('Could not save bookings', e);
    }
  }, [bookings]);

  // Derived selected event
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Saved events list
  const savedEvents = events.filter((e) => bookmarkedIds.includes(e.id));

  // Handlers
  const handleSelectEvent = (event: EventItem) => {
    setSelectedEventId(event.id);
    setCurrentView('details');
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('event', event.id);
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('Could not update history state', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDiscover = () => {
    setCurrentView('discover');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('event');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('Could not update history state', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenShare = (event: EventItem) => {
    setShareTargetEvent(event);
    setIsShareModalOpen(true);
  };

  const handleToggleBookmark = (event: EventItem) => {
    setBookmarkedIds((prev) =>
      prev.includes(event.id) ? prev.filter((id) => id !== event.id) : [...prev, event.id]
    );
  };

  const handleQuickBook = (event: EventItem) => {
    const tier = event.pricing.tiers[0] || {
      id: 'default',
      name: 'General Admission',
      price: event.pricing.startingPrice,
      description: 'Standard admission',
      available: 20,
      perks: ['Full program entry']
    };
    setCheckoutTarget({
      event,
      tier,
      quantity: 1
    });
    setIsCheckoutOpen(true);
  };

  const handleBookFromDetails = (event: EventItem, tier: TicketTier, quantity: number) => {
    setCheckoutTarget({
      event,
      tier,
      quantity
    });
    setIsCheckoutOpen(true);
  };

  const handleCompleteBooking = (newBooking: TicketBooking) => {
    setBookings((prev) => [newBooking, ...prev]);

    // Increment attendee count on event
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === newBooking.eventId) {
          return {
            ...e,
            attendeeCount: Math.min(e.capacity, e.attendeeCount + newBooking.quantity)
          };
        }
        return e;
      })
    );
  };

  // Organizer Actions
  const handleOpenCreateEvent = () => {
    setEventToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditEvent = (event: EventItem) => {
    setEventToEdit(event);
    setIsEditorOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setBookmarkedIds((prev) => prev.filter((id) => id !== eventId));
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
      setCurrentView('discover');
    }
  };

  const handleToggleStatus = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          const newStatus = e.status === 'published' ? 'draft' : 'published';
          return { ...e, status: newStatus };
        }
        return e;
      })
    );
  };

  const handleSaveEvent = (savedItem: EventItem) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedItem.id);
      if (exists) {
        return prev.map((e) => (e.id === savedItem.id ? savedItem : e));
      }
      return [savedItem, ...prev];
    });
  };

  const handleOpenAuth = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F1EA] text-[#2A2421] selection:bg-[#C85A40] selection:text-white">
      {/* Universal Glassmorphic Navigation Bar */}
      <Navbar
        currentView={currentView}
        discoverTab={discoverTab}
        onNavigate={(view, tab) => {
          setCurrentView(view);
          if (tab) {
            setDiscoverTab(tab);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        savedCount={bookmarkedIds.length}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onCreateEvent={handleOpenCreateEvent}
        onOpenAuth={() => handleOpenAuth('login')}
      />

      {/* Main View Router */}
      <main className="flex-1 w-full">
        {currentView === 'discover' && (
          <DiscoverView
            events={events}
            onSelectEvent={handleSelectEvent}
            onQuickBook={handleQuickBook}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
            initialCategory={activeCategory}
            onShareEvent={handleOpenShare}
            currentTab={discoverTab}
            onTabChange={setDiscoverTab}
          />
        )}

        {currentView === 'details' && selectedEvent && (
          <EventDetailsView
            event={selectedEvent}
            onBack={handleBackToDiscover}
            onBookTickets={handleBookFromDetails}
            isBookmarked={bookmarkedIds.includes(selectedEvent.id)}
            onToggleBookmark={handleToggleBookmark}
            onShare={handleOpenShare}
            onSelectCategory={(cat) => {
              setActiveCategory(cat);
              setCurrentView('discover');
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
          />
        )}

        {currentView === 'organizer' && (
          <OrganizerDashboard
            events={events}
            onCreateEvent={handleOpenCreateEvent}
            onEditEvent={handleEditEvent}
            onDeleteEvent={handleDeleteEvent}
            onViewEvent={handleSelectEvent}
            onToggleStatus={handleToggleStatus}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            onNavigate={(view) => {
              setCurrentView(view);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectEvent={handleSelectEvent}
            savedEvents={savedEvents}
            purchasedBookings={bookings}
            onRemoveBookmark={(id) =>
              setBookmarkedIds((prev) => prev.filter((bookmarkedId) => bookmarkedId !== id))
            }
            onShareEvent={handleOpenShare}
            allEvents={events}
          />
        )}
      </main>

      {/* Editorial Footer */}
      <Footer
        onNavigate={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Event Creation & Editor Modal */}
      <EventEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEvent}
        eventToEdit={eventToEdit}
      />

      {/* Ticket Checkout & Pass Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        event={checkoutTarget.event}
        tier={checkoutTarget.tier}
        quantity={checkoutTarget.quantity}
        onCompleteBooking={handleCompleteBooking}
        onShareEvent={handleOpenShare}
      />

      {/* Authentication Modal (Login / Signup / Password Reset) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          // If user logged in, navigate to profile if desired
        }}
      />

      {/* Saved Gatherings Drawer */}
      <BookmarksDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedEvents={savedEvents}
        onRemoveBookmark={(id) =>
          setBookmarkedIds((prev) => prev.filter((bookmarkedId) => bookmarkedId !== id))
        }
        onSelectEvent={handleSelectEvent}
        onShareEvent={handleOpenShare}
      />

      {/* Social Sharing Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        event={shareTargetEvent}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
