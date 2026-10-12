/** The pages App.tsx switches between */
export type AppView = 'discover' | 'details' | 'organizer' | 'profile' | 'ticket' | 'console';

export type EventCategory =
  | 'Sports & Outdoors'
  | 'Entertainment & Music'
  | 'Business & Entrepreneurship'
  | 'Tech & Innovation'
  | 'Education & Career'
  | 'Arts & Culture'
  | 'Social Impact & Community'
  | 'Political'
  | 'Others';

export interface CategoryDefinition {
  id: EventCategory | 'all';
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  iconName:
    | 'Compass'
    | 'Trophy'
    | 'Music'
    | 'Briefcase'
    | 'Cpu'
    | 'GraduationCap'
    | 'Palette'
    | 'HeartHandshake'
    | 'Landmark'
    | 'Shapes';
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  description: string;
  /** Total tickets of this type (set by the organizer) */
  quantity?: number;
  /** Tickets still available */
  available: number;
  /** Tickets already sold or held, set by the server */
  sold?: number;
  perks: string[];
}

export interface AgendaItem {
  time: string;
  title: string;
  detail: string;
}

export interface EventItem {
  id: string;
  organizerId?: string;
  title: string;
  subtitle: string;
  category: EventCategory;
  description: string;
  fullContent: string;
  date: string;
  isoDate: string;
  time: string;
  venue: {
    name: string;
    address: string;
    city: string;
    neighborhood: string;
    mapNote?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  /** Free events need no payment; every tier is priced at 0 */
  isFree: boolean;
  pricing: {
    /** Always 'KES' */
    currency: string;
    startingPrice: number;
    tiers: TicketTier[];
  };
  capacity: number;
  attendeeCount: number;
  imageUrl: string;
  host: {
    name: string;
    role: string;
    avatarUrl?: string;
    bio: string;
  };
  agenda: AgendaItem[];
  status: 'published' | 'draft' | 'sold_out';
  isFeatured?: boolean;
  tags: string[];
  curatorNote?: string;
  /** ISO timestamp, set by the server */
  createdAt?: string;
  /** Sales from real bookings; only sent to the event's organizer, null for everyone else */
  organizerStats?: { revenue: number; ticketsSold: number } | null;
}

export interface TicketBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  tierName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attendeeName: string;
  attendeeEmail: string;
  bookingDate: string;
  ticketCode: string;
  paymentMethod?: 'mpesa' | 'card' | 'complimentary' | 'free';
  mpesaPhoneNumber?: string;
  mpesaReceiptNumber?: string;
  mpesaMode?: 'stk' | 'paybill';
  currency?: string;
  totalInKes?: number;
  notes?: string;
  /** Link encoded in the ticket's QR code (contains the booking UUID) */
  ticketUrl?: string;
  /** Set when the ticket was scanned at the door */
  checkedInAt?: string | null;
  /** Paid bookings are pending until the payment provider confirms them */
  status?: BookingStatus;
  /** When a pending booking's ticket hold runs out */
  expiresAt?: string | null;
}

export type BookingStatus = 'pending' | 'confirmed' | 'failed' | 'expired';

/** The latest payment attempt for a booking, as reported by the server */
export interface PaymentAttempt {
  id: string;
  provider: 'simulated' | 'mpesa_stk' | 'mpesa_paybill' | 'paystack';
  method: 'mpesa' | 'card';
  status: 'pending' | 'succeeded' | 'failed';
  reference: string;
  amount: number;
  failureReason: string | null;
  authorizationUrl: string | null;
  receiptNumber: string | null;
  instructions: {
    simulated?: boolean;
    paybill?: string;
    accountNumber?: string;
    phoneNumber?: string;
    authorizationUrl?: string;
  };
}

/** A booking with its payment state: what checkout polls until the booking is settled */
export interface BookingWithPayment extends TicketBooking {
  status: BookingStatus;
  payment: PaymentAttempt | null;
  holdSecondsLeft: number | null;
}

export interface OrganizerStats {
  totalEvents: number;
  activeAttendees: number;
  grossRevenue: number;
  ticketsSold: number;
}
