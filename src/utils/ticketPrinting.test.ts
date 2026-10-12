import { describe, expect, it } from 'vitest';
import { makeBooking } from '../test/fixtures';
import { generateBookingEmailContent, getPaymentSummary } from './ticketPrinting';

describe('getPaymentSummary', () => {
  it('describes M-Pesa payments with their receipt', () => {
    expect(getPaymentSummary(makeBooking())).toEqual({
      isFree: false,
      method: 'M-Pesa',
      amount: 'KSh 7,000',
      reference: 'SFK1234AB12'
    });
  });

  it('describes card and free bookings', () => {
    expect(getPaymentSummary(makeBooking({ paymentMethod: 'card' }))).toMatchObject({ method: 'Card', reference: undefined });
    expect(getPaymentSummary(makeBooking({ paymentMethod: 'free', totalPrice: 0 }))).toEqual({
      isFree: true,
      method: 'Free entry',
      amount: 'Free'
    });
  });
});

describe('generateBookingEmailContent', () => {
  it('puts the ticket code in the subject and the details in the body', () => {
    const { subject, plainText } = generateBookingEmailContent(makeBooking());
    expect(subject).toBe('Your MagiVents ticket for Nairobi Sounds Live (MV-482913)');
    expect(plainText).toContain('Ticket: VIP (2 people)');
    expect(plainText).toContain('Payment: M-Pesa (receipt SFK1234AB12)');
  });
});
