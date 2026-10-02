import { TicketBooking } from '../types';
import { formatKES } from './format';

export const MAGIVENTS_CONTACT_EMAIL = 'magiventskenya@gmail.com';

/**
 * Triggers the native browser print dialog for the current ticket pass
 */
export function printTicket(booking: TicketBooking): void {
  if (typeof window === 'undefined') return;
  window.print();
}

export interface PaymentSummary {
  isFree: boolean;
  /** e.g. "M-Pesa", "Card", "Free entry" */
  method: string;
  /** e.g. "KSh 3,000" or "Free" */
  amount: string;
  /** M-Pesa receipt number, when there is one */
  reference?: string;
}

/** How a booking was paid, in display form. Amounts are always KSh. */
export function getPaymentSummary(booking: TicketBooking): PaymentSummary {
  const isFree = booking.paymentMethod === 'free' || booking.totalPrice === 0;
  if (isFree) {
    return { isFree, method: 'Free entry', amount: 'Free' };
  }
  const method =
    booking.paymentMethod === 'mpesa' ? 'M-Pesa' : booking.paymentMethod === 'complimentary' ? 'Complimentary' : 'Card';
  return {
    isFree,
    method,
    amount: formatKES(booking.totalPrice, null),
    reference: booking.paymentMethod === 'mpesa' ? booking.mpesaReceiptNumber || undefined : undefined
  };
}

const guestsLabel = (quantity: number) => `${quantity} ${quantity === 1 ? 'person' : 'people'}`;

/** Plain-text ticket for the "download" button. */
export function buildTicketText(booking: TicketBooking): string {
  const payment = getPaymentSummary(booking);
  const paymentLines = payment.isFree
    ? 'Payment:        Free entry'
    : [
        `Payment:        ${payment.method}`,
        payment.reference ? `M-Pesa receipt: ${payment.reference}` : null,
        booking.mpesaPhoneNumber ? `M-Pesa phone:   ${booking.mpesaPhoneNumber}` : null,
        `Amount paid:    ${payment.amount}`
      ]
        .filter(Boolean)
        .join('\n');

  return `================================================
MAGIVENTS TICKET
================================================
Ticket code:    ${booking.ticketCode}
Status:         Confirmed

Event:          ${booking.eventTitle}
Date & time:    ${booking.eventDate} · ${booking.eventTime}
Venue:          ${booking.venueName}
Attendee:       ${booking.attendeeName}
Email:          ${booking.attendeeEmail}
Ticket type:    ${booking.tierName}
Admits:         ${guestsLabel(booking.quantity)}

${paymentLines}
Booked on:      ${booking.bookingDate}

AT THE ENTRANCE:
1. Show this ticket on your phone or printed, with the ticket code.
2. Arrive early to allow time for check-in.
================================================
MagiVents · Kenya's events platform
Help: ${MAGIVENTS_CONTACT_EMAIL}
`;
}

/**
 * Generates an email subject and body for the booking confirmation
 */
export function generateBookingEmailContent(booking: TicketBooking): {
  subject: string;
  plainText: string;
} {
  const payment = getPaymentSummary(booking);
  const subject = `Your MagiVents ticket for ${booking.eventTitle} (${booking.ticketCode})`;

  const paymentLines = payment.isFree
    ? 'Payment: Free entry'
    : `Payment: ${payment.method}${payment.reference ? ` (receipt ${payment.reference})` : ''}\nAmount paid: ${payment.amount}`;

  const plainText = `Hello ${booking.attendeeName},

Your booking on MagiVents is confirmed.

Event: ${booking.eventTitle}
Date & time: ${booking.eventDate}, ${booking.eventTime}
Venue: ${booking.venueName}
Ticket: ${booking.tierName} (${guestsLabel(booking.quantity)})
Ticket code: ${booking.ticketCode}
${paymentLines}

At the entrance, show this ticket code on your phone or a printed copy. Please arrive early to allow time for check-in.

Need help? Email us at ${MAGIVENTS_CONTACT_EMAIL}.

The MagiVents Team`;

  return { subject, plainText };
}
