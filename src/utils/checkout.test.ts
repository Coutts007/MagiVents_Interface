import { describe, expect, it } from 'vitest';
import { makePendingBooking } from '../test/fixtures';
import {
  checkoutStage,
  failureMessage,
  formatCountdown,
  normalizeKenyanPhone,
  paymentAction,
  phoneError,
  pollDelay
} from './checkout';

describe('checkoutStage', () => {
  it('follows the server status; the browser never decides a payment succeeded', () => {
    expect(checkoutStage(makePendingBooking())).toBe('awaiting-payment');
    expect(checkoutStage(makePendingBooking({ status: 'confirmed' }))).toBe('confirmed');
    expect(checkoutStage(makePendingBooking({ status: 'failed' }))).toBe('failed');
    expect(checkoutStage(makePendingBooking({ status: 'expired' }))).toBe('expired');
  });
});

describe('paymentAction', () => {
  it('shows the phone prompt, Paybill instructions, or the card page', () => {
    expect(paymentAction(makePendingBooking())).toBe('phone-prompt');
    expect(paymentAction(makePendingBooking({ mpesaMode: 'paybill' }))).toBe('paybill');
    const card = makePendingBooking();
    card.payment = { ...card.payment!, method: 'card', provider: 'paystack', authorizationUrl: 'https://checkout.paystack.com/x' };
    expect(paymentAction(card)).toBe('card-redirect');
    card.payment = { ...card.payment, authorizationUrl: null };
    expect(paymentAction(card)).toBe('card-processing');
  });
});

describe('failureMessage', () => {
  it('uses the provider reason, with a fallback and an expiry message', () => {
    const failed = makePendingBooking({ status: 'failed' });
    failed.payment = { ...failed.payment!, failureReason: 'The M-Pesa PIN was wrong.' };
    expect(failureMessage(failed)).toBe('The M-Pesa PIN was wrong.');
    expect(failureMessage(makePendingBooking({ status: 'failed', payment: null }))).toBe('The payment was not completed.');
    expect(failureMessage(makePendingBooking({ status: 'expired' }))).toMatch(/time to pay ran out/);
  });
});

describe('formatCountdown', () => {
  it('shows minutes and padded seconds, never negative', () => {
    expect(formatCountdown(600)).toBe('10:00');
    expect(formatCountdown(545)).toBe('9:05');
    expect(formatCountdown(9.8)).toBe('0:09');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});

describe('pollDelay', () => {
  it('polls quickly at first, then backs off', () => {
    expect(pollDelay(0)).toBe(2500);
    expect(pollDelay(15)).toBe(4000);
    expect(pollDelay(100)).toBe(8000);
  });
});

describe('Kenyan phone numbers', () => {
  it('normalizes the common ways people write them, like the server does', () => {
    for (const raw of ['0712 345 678', '+254712345678', '254712345678', '712345678', '0712-345-678']) {
      expect(normalizeKenyanPhone(raw)).toBe('254712345678');
    }
    expect(normalizeKenyanPhone('0110 123 456')).toBe('254110123456');
  });

  it('rejects anything that is not a Kenyan mobile number', () => {
    for (const raw of ['', '12345', '0812345678', 'abc', '+1 555 123 4567']) {
      expect(normalizeKenyanPhone(raw)).toBeNull();
    }
    expect(phoneError('')).toMatch(/Enter the M-Pesa phone number/);
    expect(phoneError('0812345678')).toMatch(/valid M-Pesa number/);
    expect(phoneError('0712345678')).toBeNull();
  });
});
