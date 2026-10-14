import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AppView, BookingWithPayment, EventItem, TicketTier, TicketBooking } from './types';
import { AuthModalMode } from './types/auth';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  BookingRequest,
  EventInput,
  bookingsApi,
  bookmarksApi,
  consoleApi,
  gatheringsApi,
  getApiErrorMessage,
  publishBlockedReason,
  PublishBlocked,
  ticketsApi
} from './services/api';
import { Navbar } from './components/navigation/Navbar';
import { DiscoverView } from './components/discover/DiscoverView';
import { EventDetailsView } from './components/event-details/EventDetailsView';
import { OrganizerDashboard } from './components/organizer/OrganizerDashboard';
import { ProfileView } from './components/profile/ProfileView';
import { EventEditorModal } from './components/organizer/EventEditorModal';
import { BecomeOrganizerModal } from './components/organizer/BecomeOrganizerModal';
import { CheckoutModal } from './components/checkout/CheckoutModal';
import { AuthModal } from './components/auth/AuthModal';
import { BookmarksDrawer } from './components/bookmarks/BookmarksDrawer';
import { ShareModal } from './components/share/ShareModal';
import { Footer } from './components/common/Footer';
import { SearchDialog } from './components/search/SearchDialog';
import { TicketView } from './components/ticket/TicketView';
import { Modal } from './components/ui/Modal';
import { PayListingFeePanel } from './components/organizer/PayListingFeePanel';

// Staff console code is only downloaded once the server has confirmed a staff member on the secret path
const AdminConsole = lazy(() => import('./components/console/AdminConsole').then((m) => ({ default: m.AdminConsole })));
// The admin dashboard is only downloaded by admins (the server refuses its API to everyone else)
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));

/** The single path segment the page was opened at, e.g. "/abc/" -> "abc" ("" on the home page) */
function pathSegment(): string {
  const segment = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return segment.includes('/') ? '' : segment;
}

function toEventInput(event: EventItem): EventInput {
  const { id, attendeeCount, organizerId, organizerStats, ...input } = event;
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

  // Navigation State
  const [currentView, setCurrentView] = useState<AppView>('discover');

  // Staff console: the secret path lives only on the server. Any other path, or a non-staff account,
  // gets a 404 from the server and the normal site is shown.
  const [consoleSession, setConsoleSession] = useState<{ secret: string; staffName: string } | null>(null);
  useEffect(() => {
    const segment = pathSegment();
    if (!segment || !user) {
      setConsoleSession(null);
      setCurrentView((view) => (view === 'console' ? 'discover' : view));
      return;
    }
    let cancelled = false;
    consoleApi(segment)
      .session()
      .then(({ staff }) => {
        if (cancelled) return;
        setConsoleSession({ secret: segment, staffName: staff.name });
        setCurrentView('console');
      })
      .catch(() => {
        if (!cancelled) setConsoleSession(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /** Leaving the console takes the secret out of the address bar */
  const leaveConsolePath = () => {
    if (pathSegment()) {
      const url = new URL(window.location.href);
      url.pathname = '/';
      window.history.replaceState({}, '', url.toString());
    }
  };

  // "Find my ticket" page: a ticket opened from its QR/email link (?ticket=<uuid>) or found by code + email
  const [ticketViewBooking, setTicketViewBooking] = useState<TicketBooking | null>(null);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [ticketLoadError, setTicketLoadError] = useState<string | null>(null);
  const [discoverTab, setDiscoverTab] = useState<'grid' | 'calendar'>('grid');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Site-wide search: the panel and the Discover search box share one query
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // "/" or Ctrl/Cmd+K opens search, unless the user is typing in a field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        !!target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      const isShortcut = (e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !isTyping);
      if (isShortcut) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // "Pay KSh X to publish": the event whose listing fee is being paid
  const [payFeeFor, setPayFeeFor] = useState<{ eventId: string; title: string; amountDue?: number } | null>(null);

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<EventItem | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  // Set when checkout reopens an existing booking (the card payment page sends people back with ?booking=<id>)
  const [resumeBookingId, setResumeBookingId] = useState<string | null>(null);
  const [checkoutTarget, setCheckoutTarget] = useState<{
    event: EventItem | null;
    tier: TicketTier | null;
    quantity: number;
  }>({ event: null, tier: null, quantity: 1 });

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);

  // Upgrade to organizer; `then` says whether to open the event editor afterwards
  const [becomeOrganizer, setBecomeOrganizer] = useState<{ open: boolean; thenCreate: boolean }>({
    open: false,
    thenCreate: false
  });
  // Admins keep the organizer abilities
  const isOrganizer = user?.role === 'curator' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';

  // ?view=admin (the link in admin notification emails) opens the dashboard; it closes when not an admin
  useEffect(() => {
    if (isInitializing) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'admin') {
      if (isAdmin) setCurrentView('admin');
      params.delete('view');
      const url = new URL(window.location.href);
      url.search = params.toString();
      window.history.replaceState({}, '', url.toString());
    }
    if (!isAdmin) setCurrentView((view) => (view === 'admin' ? 'discover' : view));
  }, [isAdmin, isInitializing]);
  const isSuspended = Boolean(user?.isSuspended);

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
      setNotice(getApiErrorMessage(err, 'Could not load events.'));
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
      .catch((err) => setNotice(getApiErrorMessage(err, 'Could not load your saved events.')));
    bookingsApi
      .list()
      .then(setBookings)
      .catch((err) => setNotice(getApiErrorMessage(err, 'Could not load your tickets.')));
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

  // Back from setting a password (organizer invitation or reset): ?signin=1 opens the sign-in form
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('signin') !== '1') return;
    url.searchParams.delete('signin');
    window.history.replaceState({}, '', url.toString());
    setNotice('Your password is set. Sign in with your email and new password.');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  }, []);

  // Back from the card payment page: ?booking=<id> reopens checkout on that booking's payment status
  useEffect(() => {
    const bookingId = new URLSearchParams(window.location.search).get('booking');
    if (!bookingId) return;
    setResumeBookingId(bookingId);
    setIsCheckoutOpen(true);
    const url = new URL(window.location.href);
    url.searchParams.delete('booking');
    url.searchParams.delete('reference');
    url.searchParams.delete('trxref');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Ticket links: ?ticket=<booking uuid> opens that ticket
  useEffect(() => {
    const openTicketFromUrl = () => {
      const ticketId = new URLSearchParams(window.location.search).get('ticket');
      if (!ticketId) return;
      setCurrentView('ticket');
      setIsTicketLoading(true);
      setTicketLoadError(null);
      ticketsApi
        .get(ticketId)
        .then(setTicketViewBooking)
        .catch((err) => {
          setTicketViewBooking(null);
          setTicketLoadError(getApiErrorMessage(err, 'This ticket link could not be opened.'));
        })
        .finally(() => setIsTicketLoading(false));
    };
    openTicketFromUrl();
    window.addEventListener('popstate', openTicketFromUrl);
    return () => window.removeEventListener('popstate', openTicketFromUrl);
  }, []);

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
      url.searchParams.delete('ticket');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('Could not update history state', e);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Shows every match for `query` in the Discover grid and scrolls to the results. */
  const handleShowAllResults = (query: string) => {
    setSearchQuery(query);
    setDiscoverTab('grid');
    setCurrentView('discover');
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('event');
      window.history.pushState({}, '', url.toString());
    } catch (e) {
      console.warn('Could not update history state', e);
    }
    // Wait for the Discover view to render before scrolling to its results
    setTimeout(() => {
      document.getElementById('event-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
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
      setNotice(getApiErrorMessage(err, 'Could not update your saved events.'));
    }
  };

  const handleRemoveBookmark = (eventId: string) => {
    const event = events.find((e) => e.id === eventId);
    if (event && bookmarkedIds.includes(eventId)) {
      handleToggleBookmark(event);
    }
  };

  // Booking is open to guests: no account is needed to register or buy tickets
  const openCheckout = (event: EventItem, tier: TicketTier, quantity: number) => {
    setResumeBookingId(null);
    setCheckoutTarget({ event, tier, quantity });
    setIsCheckoutOpen(true);
  };

  const handleQuickBook = (event: EventItem) => {
    const tier = event.pricing.tiers[0] || {
      id: '',
      name: event.isFree ? 'Free Entry' : 'General Admission',
      price: event.isFree ? 0 : event.pricing.startingPrice,
      description: '',
      available: event.capacity - event.attendeeCount,
      perks: []
    };
    openCheckout(event, tier, 1);
  };

  const handleBookFromDetails = (event: EventItem, tier: TicketTier, quantity: number) => {
    openCheckout(event, tier, quantity);
  };

  const refreshEvents = () => {
    // Attendee counts and tier availability change with every booking and hold
    gatheringsApi
      .list()
      .then(setEvents)
      .catch(() => undefined);
  };

  const handleCompleteBooking = async (request: BookingRequest): Promise<BookingWithPayment> => {
    let booking: BookingWithPayment;
    try {
      booking = await bookingsApi.create(request);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Your reservation could not be completed.'));
    }
    refreshEvents();
    return booking;
  };

  // Free bookings confirm at once; paid ones when the payment provider reports success
  const handleBookingConfirmed = (booking: TicketBooking) => {
    if (user) {
      setBookings((prev) => [booking, ...prev.filter((b) => b.id !== booking.id)]);
    }
    refreshEvents();
  };

  // Organizer Actions
  const handleOpenCreateEvent = () => {
    if (!requireAuth()) return;
    if (!isOrganizer) {
      setBecomeOrganizer({ open: true, thenCreate: true });
      return;
    }
    if (isSuspended) {
      setNotice('Your organizer account is suspended, so you cannot create events. Contact MagiVents for help.');
      return;
    }
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
      setNotice(getApiErrorMessage(err, 'Could not delete this event.'));
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
      if (!openPayStepFor(event, err)) {
        setNotice(getApiErrorMessage(err, 'Could not change the status of this event.'));
      }
    }
  };

  const upsertEvent = (saved: EventItem) =>
    setEvents((prev) =>
      prev.some((e) => e.id === saved.id) ? prev.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...prev]
    );

  const handleSaveEvent = async (savedItem: EventItem, existingId: string | null): Promise<EventItem> => {
    let saved: EventItem;
    try {
      saved = existingId
        ? await gatheringsApi.update(existingId, toEventInput(savedItem))
        : await gatheringsApi.create(toEventInput(savedItem));
    } catch (err) {
      const reason = publishBlockedReason(err);
      // e.g. moving a paid event to a dearer category: the editor offers to pay the difference
      if (reason) throw new PublishBlocked(reason);
      throw new Error(getApiErrorMessage(err, 'Could not save this event.'));
    }
    upsertEvent(saved);
    return saved;
  };

  /** Opens the Pay to publish step when the server refused because the listing fee is due. */
  const openPayStepFor = (event: { id: string; title: string }, err: unknown): boolean => {
    const reason = publishBlockedReason(err);
    if (!reason || !['listing_fee_due', 'listing_fee_pending'].includes(reason.code)) return false;
    setPayFeeFor({ eventId: event.id, title: event.title, amountDue: reason.amountDue });
    return true;
  };

  /**
   * Publishes a saved draft. The server checks every publishing rule; when only the listing fee is missing,
   * the Pay to publish step opens instead of an error.
   */
  const handlePublishEvent = async (event: EventItem): Promise<void> => {
    try {
      upsertEvent(await gatheringsApi.setStatus(event.id, 'published'));
    } catch (err) {
      if (openPayStepFor(event, err)) return;
      throw new Error(getApiErrorMessage(err, 'Could not publish this event.'));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#E9E2D6] text-[#1E1814] selection:bg-[#8A4F33] selection:text-white">
      {/* Navigation bar */}
      <Navbar
        currentView={currentView}
        discoverTab={discoverTab}
        onNavigate={(view, tab) => {
          if (currentView === 'console') leaveConsolePath();
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
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {notice && (
        <div
          role="alert"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-md w-[calc(100%-2rem)] px-4 py-3 rounded-2xl bg-[#1E1814] text-white text-xs shadow-lg flex items-start gap-3"
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTag={activeTag}
            onTagChange={setActiveTag}
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
            onSelectTag={(tag) => {
              setActiveTag(tag);
              setDiscoverTab('grid');
              handleBackToDiscover();
              setTimeout(() => {
                document.getElementById('event-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 50);
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
            onPayListingFee={(event) =>
              setPayFeeFor({ eventId: event.id, title: event.title, amountDue: event.listingFee?.amountDue })
            }
            isOrganizer={isOrganizer}
            suspensionReason={isSuspended ? user?.suspensionReason || '' : null}
            onBecomeOrganizer={() => {
              if (requireAuth()) setBecomeOrganizer({ open: true, thenCreate: false });
            }}
          />
        )}

        {currentView === 'admin' && isAdmin && user && (
          <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-sm text-[#675A50]">Loading…</div>}>
            <AdminDashboard adminName={user.name || user.email} />
          </Suspense>
        )}

        {currentView === 'console' && consoleSession && (
          <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-sm text-[#675A50]">Loading…</div>}>
            <AdminConsole secret={consoleSession.secret} staffName={consoleSession.staffName} />
          </Suspense>
        )}

        {currentView === 'ticket' && (
          <TicketView
            booking={ticketViewBooking}
            onBookingFound={(booking) => {
              setTicketViewBooking(booking);
              setTicketLoadError(null);
              if (!booking) {
                // Leaving a ticket link: drop it from the address bar
                const url = new URL(window.location.href);
                url.searchParams.delete('ticket');
                window.history.replaceState({}, '', url.toString());
              }
            }}
            isLoading={isTicketLoading}
            loadError={ticketLoadError}
            onBrowseEvents={handleBackToDiscover}
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

      {/* Footer */}
      <Footer
        onNavigate={(view, tab) => {
          if (currentView === 'console') leaveConsolePath();
          setCurrentView(view);
          if (tab) {
            setDiscoverTab(tab);
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Event Creation & Editor Modal */}
      <EventEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveEvent}
        onPublish={handlePublishEvent}
        eventToEdit={eventToEdit}
      />

      {/* Pay to publish */}
      <Modal
        isOpen={payFeeFor !== null}
        onClose={() => setPayFeeFor(null)}
        title="Pay to publish"
        subtitle={payFeeFor?.title}
        maxWidth="lg"
      >
        {payFeeFor && (
          <PayListingFeePanel
            key={payFeeFor.eventId}
            eventId={payFeeFor.eventId}
            eventTitle={payFeeFor.title}
            amountHint={payFeeFor.amountDue}
            onSettled={() => refreshEvents()}
            onCancel={() => {
              setPayFeeFor(null);
              refreshEvents();
            }}
          />
        )}
      </Modal>

      {/* Attendee -> organizer upgrade */}
      <BecomeOrganizerModal
        isOpen={becomeOrganizer.open}
        onClose={() => setBecomeOrganizer({ open: false, thenCreate: false })}
        onBecameOrganizer={() => {
          const { thenCreate } = becomeOrganizer;
          setBecomeOrganizer({ open: false, thenCreate: false });
          if (thenCreate) {
            setEventToEdit(null);
            setIsEditorOpen(true);
          }
        }}
      />

      {/* Ticket Checkout & Pass Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setResumeBookingId(null);
          refreshEvents();
        }}
        event={resumeBookingId ? null : checkoutTarget.event}
        findEvent={(eventId) => events.find((e) => e.id === eventId)}
        tier={checkoutTarget.tier}
        quantity={checkoutTarget.quantity}
        onCompleteBooking={handleCompleteBooking}
        onBookingConfirmed={handleBookingConfirmed}
        resumeBookingId={resumeBookingId}
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

      {/* Site-wide Event Search */}
      <SearchDialog
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        events={events}
        initialQuery={searchQuery}
        onSelectEvent={handleSelectEvent}
        onShowAll={handleShowAllResults}
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
