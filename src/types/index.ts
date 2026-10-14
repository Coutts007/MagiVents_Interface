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
  /** People one ticket admits: 1 by default, 2 for a couple, the group size for a group ticket */
  admits?: number;
  /** Flash sale: the lower price between saleStartsAt and saleEndsAt (ISO, UTC), for up to saleQuantity tickets */
  salePrice?: number | null;
  saleStartsAt?: string | null;
  saleEndsAt?: string | null;
  saleQuantity?: number | null;
  /** Set by the server: tickets still available at the sale price (null when the sale has no limit) */
  saleRemaining?: number | null;
  /** Set by the server when the response was made */
  saleActive?: boolean;
  currentPrice?: number;
  /** The tier's own sales window (ISO, UTC); e.g. an Early Bird tier closes by itself */
  onSaleFrom?: string | null;
  onSaleUntil?: string | null;
  salesState?: 'on_sale' | 'not_started' | 'ended';
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
  /** People admitted by confirmed bookings (a couple ticket counts 2); only sent to the organizer */
  confirmedAttendees?: number | null;
}

export interface TicketBooking {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venueName: string;
  tierName: string;
  /** Tickets bought */
  quantity: number;
  /** People the booking admits in total, and per ticket (a couple ticket admits 2) */
  admits?: number;
  admitsPerTicket?: number;
  /** The unit price actually charged, and whether it was a flash-sale price */
  unitPrice: number;
  isSalePrice?: boolean;
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
