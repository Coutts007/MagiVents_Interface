export type EventCategory =
  | 'Culinary & Wine'
  | 'Architecture & Design'
  | 'Fine Arts & Craft'
  | 'Music & Performance'
  | 'Literature & Thought'
  | 'Gatherings & Salons';

export interface CategoryDefinition {
  id: EventCategory | 'all';
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  iconName: 'UtensilsCrossed' | 'Building2' | 'Palette' | 'Music' | 'BookOpen' | 'Sparkles' | 'Compass';
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
  pricing: {
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
}

export interface OrganizerStats {
  totalEvents: number;
  activeAttendees: number;
  grossRevenue: number;
  ticketsSold: number;
}
