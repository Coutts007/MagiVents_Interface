import { BookingWithPayment } from '../types';

/** What the checkout screen shows for a booking returned by the server. */
export type CheckoutStage = 'confirmed' | 'awaiting-payment' | 'failed' | 'expired';

export function checkoutStage(booking: BookingWithPayment): CheckoutStage {
  if (booking.status === 'confirmed') return 'confirmed';
  if (booking.status === 'expired') return 'expired';
  if (booking.status === 'failed') return 'failed';
  return 'awaiting-payment';
}

/** How the attendee completes a pending payment. */
export type PaymentAction = 'phone-prompt' | 'paybill' | 'card-redirect' | 'card-processing';

export function paymentAction(booking: BookingWithPayment): PaymentAction {
  const payment = booking.payment;
  if (payment?.method === 'card') {
    return payment.authorizationUrl ? 'card-redirect' : 'card-processing';
  }
  return booking.mpesaMode === 'paybill' ? 'paybill' : 'phone-prompt';
}

/** Why the payment did not go through, in words for the attendee. */
export function failureMessage(booking: BookingWithPayment): string {
  if (booking.status === 'expired') {
    return 'The time to pay ran out, so your tickets were released. You can try again if places are still available.';
  }
  return booking.payment?.failureReason || 'The payment was not completed.';
}

/** 545 -> "9:05" */
export function formatCountdown(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

/** Poll quickly while an M-Pesa prompt can still be answered (about 90 s), so the result shows within seconds
 * of the attendee acting on it; then back off (Paybill payments take longer). */
export function pollDelay(attempt: number): number {
  if (attempt < 36) return 2500;
  if (attempt < 60) return 4000;
  return 8000;
}

/**
 * Same rules as the server: a Kenyan mobile number in any common form becomes "2547XXXXXXXX" or
 * "2541XXXXXXXX". Returns null when it is not a valid number.
 */
export function normalizeKenyanPhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-+()]/g, '');
  if (!/^\d+$/.test(digits)) return null;
  if (digits.startsWith('254')) digits = digits.slice(3);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length !== 9 || !['7', '1'].includes(digits[0])) return null;
  return `254${digits}`;
}

export function phoneError(raw: string): string | null {
  if (!raw.trim()) return 'Enter the M-Pesa phone number to send the payment request to.';
  return normalizeKenyanPhone(raw) ? null : 'Enter a valid M-Pesa number, e.g. 0712 345 678.';
}
