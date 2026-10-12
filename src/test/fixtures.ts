import { BookingWithPayment, EventItem, TicketBooking } from '../types';

export function makeEvent(overrides: Partial<EventItem> = {}): EventItem {
  return {
    id: 'nairobi-sounds-live',
    title: 'Nairobi Sounds Live',
    subtitle: 'An evening of Kenyan music',
    category: 'Entertainment & Music',
    description: 'Benga, gengetone and Afro-fusion on one stage.',
    fullContent: '',
    date: 'Friday, 20 Nov 2026',
    isoDate: '2026-11-20',
    time: '17:00 — 23:30',
    venue: { name: 'Kenya National Theatre', address: 'Harry Thuku Road', city: 'Nairobi', neighborhood: 'Upper Hill' },
    isFree: false,
    pricing: { currency: 'KES', startingPrice: 1000, tiers: [] },
    capacity: 800,
    attendeeCount: 120,
    imageUrl: '',
    host: { name: 'Wanjiru Events', role: 'Promoter', bio: '' },
    agenda: [],
    status: 'published',
    tags: ['music', 'Live Band'],
    ...overrides
  };
}

export function makeBooking(overrides: Partial<TicketBooking> = {}): TicketBooking {
  return {
    id: '5a312615-2c4f-4b78-a620-8f950dc1d680',
    eventId: 'nairobi-sounds-live',
    eventTitle: 'Nairobi Sounds Live',
    eventDate: 'Friday, 20 Nov 2026',
    eventTime: '17:00 — 23:30',
    venueName: 'Kenya National Theatre',
    tierName: 'VIP',
    quantity: 2,
    unitPrice: 3500,
    totalPrice: 7000,
    attendeeName: 'Achieng Otieno',
    attendeeEmail: 'achieng@example.com',
    bookingDate: 'Oct 12, 2026',
    ticketCode: 'MV-482913',
    paymentMethod: 'mpesa',
    mpesaReceiptNumber: 'SFK1234AB12',
    ...overrides
  };
}

export function makePendingBooking(overrides: Partial<BookingWithPayment> = {}): BookingWithPayment {
  return {
    ...makeBooking({ ticketCode: null as unknown as string }),
    status: 'pending',
    expiresAt: '2026-10-12T10:10:00Z',
    holdSecondsLeft: 600,
    mpesaMode: 'stk',
    payment: {
      id: 'p1',
      provider: 'mpesa_stk',
      method: 'mpesa',
      status: 'pending',
      reference: 'MVABCD2345',
      amount: 7000,
      failureReason: null,
      authorizationUrl: null,
      receiptNumber: null,
      instructions: { phoneNumber: '254712345678' }
    },
    ...overrides
  };
}
