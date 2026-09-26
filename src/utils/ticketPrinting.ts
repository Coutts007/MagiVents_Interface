import { TicketBooking } from '../types';

/**
 * Triggers the native browser print dialog for the current ticket pass
 */
export function printTicket(booking: TicketBooking): void {
  if (typeof window === 'undefined') return;
  window.print();
}

/**
 * Generates an email subject and body for the booking confirmation
 */
export function generateBookingEmailContent(booking: TicketBooking): {
  subject: string;
  plainText: string;
  htmlPreview: string;
} {
  const subject = `Confirmation: Admission Voucher for ${booking.eventTitle} (${booking.ticketCode})`;

  const mpesaDetails =
    booking.paymentMethod === 'mpesa'
      ? `\nPayment Method: Safaricom M-Pesa\nM-Pesa Phone: ${booking.mpesaPhoneNumber || 'N/A'}\nM-Pesa Receipt: ${booking.mpesaReceiptNumber || 'Verified'}\nTotal Amount Paid: KES ${(booking.totalInKes || booking.totalPrice * 130).toLocaleString()} ($${booking.totalPrice})`
      : `\nPayment Method: Debit / Credit Card\nTotal Amount Paid: $${booking.totalPrice}`;

  const plainText = `Dear ${booking.attendeeName},

Thank you for reserving your experience with MagiVents. Your admission voucher has been confirmed for:

GATHERING: ${booking.eventTitle}
DATE & TIME: ${booking.eventDate} at ${booking.eventTime}
VENUE: ${booking.venueName}
ADMISSION TIER: ${booking.tierName} (${booking.quantity} guest${booking.quantity > 1 ? 's' : ''})
OFFICIAL TICKET VOUCHER CODE: ${booking.ticketCode}
${mpesaDetails}

CHECK-IN INSTRUCTIONS:
- Present this digital pass or printed voucher upon arrival at reception.
- Doors open 30 minutes prior to the scheduled start time.
- If you have dietary preferences or accessibility accommodations, please inform reception.

We look forward to welcoming you to this curated edition.

Warmly,
The MagiVents Curatorial Committee
https://magivents.com`;

  const htmlPreview = `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 600px; margin: 0 auto; background: #FAF8F5; border: 1px solid #E2DDD5; border-radius: 20px; overflow: hidden; color: #2A2421;">
      <div style="background: #2A2421; padding: 24px 32px; color: #FFFFFF;">
        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #C85A40; font-weight: bold;">MagiVents Curated Editions</span>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 24px; margin: 6px 0 0 0; font-weight: 500;">Admission Voucher & Receipt</h1>
      </div>
      <div style="padding: 32px;">
        <p style="font-size: 14px; margin-top: 0;">Dear <strong>${booking.attendeeName}</strong>,</p>
        <p style="font-size: 13px; color: #736B66; line-height: 1.6;">
          Your reservation is confirmed. Please keep this digital admission voucher accessible upon arrival at the venue.
        </p>

        <div style="background: #FFFFFF; border: 1px solid #E2DDD5; border-radius: 16px; padding: 20px; margin: 20px 0;">
          <div style="border-bottom: 1px dashed #E2DDD5; padding-bottom: 12px; margin-bottom: 12px; display: flex; justify-content: space-between;">
            <div>
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #736B66;">Pass Reference</span>
              <div style="font-family: monospace; font-size: 14px; font-weight: bold; color: #C85A40;">${booking.ticketCode}</div>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #736B66;">Status</span>
              <div style="font-size: 12px; font-weight: bold; color: #00A34D;">● Confirmed / Paid</div>
            </div>
          </div>

          <h2 style="font-family: 'Playfair Display', serif; font-size: 18px; margin: 0 0 12px 0;">${booking.eventTitle}</h2>
          <table style="width: 100%; font-size: 12px; color: #736B66; line-height: 1.8;">
            <tr>
              <td style="font-weight: 600; color: #2A2421; width: 35%;">Date & Time:</td>
              <td>${booking.eventDate} · ${booking.eventTime}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #2A2421;">Venue:</td>
              <td>${booking.venueName}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #2A2421;">Admission Tier:</td>
              <td>${booking.tierName} (${booking.quantity} Guest${booking.quantity > 1 ? 's' : ''})</td>
            </tr>
            <tr>
              <td style="font-weight: 600; color: #2A2421;">Payment:</td>
              <td>${booking.paymentMethod === 'mpesa' ? `M-Pesa (${booking.mpesaReceiptNumber || 'Verified'}) · KES ${(booking.totalInKes || booking.totalPrice * 130).toLocaleString()}` : `Debit / Credit Card · $${booking.totalPrice}`}</td>
            </tr>
          </table>
        </div>

        <div style="background: #F4F1EA; border-radius: 12px; padding: 16px; font-size: 12px; color: #736B66; line-height: 1.5;">
          <strong style="color: #2A2421; display: block; margin-bottom: 4px;">Important Entry Notes</strong>
          Check-in begins 30 minutes prior to scheduled start. Present the QR code on your mobile pass or a printed copy at the entrance door.
        </div>
      </div>
      <div style="background: #EBE6DF; padding: 16px 32px; font-size: 11px; color: #736B66; text-align: center;">
        MagiVents Editions · Curated Cultural Gatherings · All rights reserved.
      </div>
    </div>
  `;

  return { subject, plainText, htmlPreview };
}
