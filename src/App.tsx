import React, { useState, useEffect, useCallback } from 'react';
import { EventItem, TicketTier, TicketBooking } from './types';
import { AuthModalMode } from './types/auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  BookingRequest,
  EventInput,
  bookingsApi,
  bookmarksApi,
  gatheringsApi,
  getApiErrorMessage
} from './services/api';
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

function toEventInput(event: EventItem): EventInput {
  const { id, attendeeCount, organizerId, ...input } = event;
  return input;
}

function MainLayout() {
  const { user, isInitializing } = useAuth();

  // Server data
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [bookings, setBookings] = useState<TicketBooking[]>([]);

  // Transient error/info banner
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

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

  const loadEvents = useCallback(async () => {
    setIsEventsLoading(true);
    try {
      setEvents(await gatheringsApi.list());
    } catch (err) {
      setNotice(getApiErrorMessage(err, 'Could not load gatherings.'));
    } finally {
      setIsEventsLoading(false);
    }
  }, []);

  // Reload events when the session changes, so an organizer's own drafts are included
  useEffect(() => {
    if (!isInitializing) {
      loadEvents();
    }
  }, [loadEvents, isInitializing, user?.id]);

  // Per-user data
  useEffect(() => {
    if (!user) {
      setBookmarkedIds([]);
      setBookings([]);
      return;
    }
    bookmarksApi
      .list()
      .then(setBookmarkedIds)
      .catch((err) => setNotice(getApiErrorMessage(err, 'Could not load your saved gatherings.')));
    bookingsApi
      .list()
      .then(setBookings)
      .catch((err) => setNotice(getApiErrorMessage(err, 'Could not load your passes.')));
  }, [user?.id]);

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

  // Derived selected event
  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  // Saved events list
  const savedEvents = events.filter((e) => bookmarkedIds.includes(e.id));

  // Gatherings owned by the signed-in organizer
  const myEvents = user ? events.filter((e) => e.organizerId === user.id) : [];

  const handleOpenAuth = (mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  /** Returns true when signed in; otherwise opens the sign-in modal. */
  const requireAuth = () => {
    if (user) return true;
    handleOpenAuth('login');
    return false;
  };

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

  const handleToggleBookmark = async (event: EventItem) => {
    if (!requireAuth()) return;
    const previous = bookmarkedIds;
    // Optimistic update, reverted if the server call fails
    setBookmarkedIds((prev) =>
      prev.includes(event.id) ? prev.filter((id) => id !== event.id) : [...prev, event.id]
    );
    try {
      await bookmarksApi.toggle(event.id);
    } catch (err) {
      setBookmarkedIds(previous);
      setNotice(getApiErrorMessage(err, 'Could not update your saved gatherings.'));
    }
  };

  const handleRemoveBookmark = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event && bookmarkedIds.includes(eventId)) {
      handleToggleBookmark(event);
    }
  };

  const openCheckout = (event: EventItem, tier: TicketTier, quantity: number) => {
    if (!requireAuth()) return;
    setCheckoutTarget({ event, tier, quantity });
    setIsCheckoutOpen(true);
  };

  const handleQuickBook = (event: EventItem) => {
    const tier = event.pricing.tiers[0] || {
      id: '',
      name: 'General Admission',
      price: event.pricing.startingPrice,
      description: 'Standard admission',
      available: event.capacity - event.attendeeCount,
      perks: ['Full program entry']
    };
    openCheckout(event, tier, 1);
  };

  const handleBookFromDetails = (event: EventItem, tier: TicketTier, quantity: number) => {
    openCheckout(event, tier, quantity);
  };

  const handleCompleteBooking = async (request: BookingRequest): Promise<TicketBooking> => {
    let booking: TicketBooking;
    try {
      booking = await bookingsApi.create(request);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Your reservation could not be completed.'));
    }
    setBookings((prev) => [booking, ...prev]);
    // Refresh attendee counts and tier availability
    gatheringsApi
      .list()
      .then(setEvents)
      .catch(() => undefined);
    return booking;
  };

  // Organizer Actions
  const handleOpenCreateEvent = () => {
    if (!requireAuth()) return;
    setEventToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditEvent = (event: EventItem) => {
    setEventToEdit(event);
    setIsEditorOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await gatheringsApi.remove(eventId);
    } catch (err) {
      setNotice(getApiErrorMessage(err, 'Could not delete this gathering.'));
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    setBookmarkedIds((prev) => prev.filter((id) => id !== eventId));
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
      setCurrentView('discover');
    }
  };

  const handleToggleStatus = async (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    try {
      const updated = await gatheringsApi.setStatus(eventId, event.status === 'published' ? 'draft' : 'published');
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)));
    } catch (err) {
      setNotice(getApiErrorMessage(err, 'Could not change the status of this gathering.'));
    }
  };

  const handleSaveEvent = async (savedItem: EventItem): Promise<void> => {
    let saved: EventItem;
    try {
      saved = eventToEdit
        ? await gatheringsApi.update(eventToEdit.id, toEventInput(savedItem))
        : await gatheringsApi.create(toEventInput(savedItem));
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Could not save this gathering.'));
    }
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === saved.id);
      if (exists) {
        return prev.map((e) => (e.id === saved.id ? saved : e));
      }
      return [saved, ...prev];
    });
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

      {notice && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-2xl bg-[#2A2421] text-white text-xs shadow-lg flex items-start gap-3"
        >
          <span className="flex-1 leading-relaxed">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-white/70 hover:text-white cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

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
            isLoading={isEventsLoading}
            onRefresh={loadEvents}
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
            events={myEvents}
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
            onRemoveBookmark={handleRemoveBookmark}
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
        onRemoveBookmark={handleRemoveBookmark}
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
