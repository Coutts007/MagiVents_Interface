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
  available: number;
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
}

export interface OrganizerStats {
  totalEvents: number;
  activeAttendees: number;
  grossRevenue: number;
  ticketsSold: number;
}
