import { describe, expect, it } from 'vitest';
import { EMPTY_PAYOUT_DETAILS, PayoutDetailsInput, payoutDetailsError } from './payoutDetails';

const details = (overrides: Partial<PayoutDetailsInput>): PayoutDetailsInput => ({ ...EMPTY_PAYOUT_DETAILS, ...overrides });

describe('payoutDetailsError', () => {
  it('accepts Kenyan M-Pesa numbers in common formats', () => {
    expect(payoutDetailsError(details({ phoneNumber: '0712 345 678' }))).toBeNull();
    expect(payoutDetailsError(details({ phoneNumber: '+254 110 345 678' }))).toBeNull();
    expect(payoutDetailsError(details({ phoneNumber: '12345' }))?.field).toBe('phoneNumber');
  });

  it('checks Till and Paybill numbers', () => {
    expect(payoutDetailsError(details({ method: 'till', tillNumber: '5123456' }))).toBeNull();
    expect(payoutDetailsError(details({ method: 'till', tillNumber: '12ab' }))?.field).toBe('tillNumber');
    expect(payoutDetailsError(details({ method: 'paybill', paybillNumber: '247247' }))?.field).toBe('paybillAccount');
    expect(payoutDetailsError(details({ method: 'paybill', paybillNumber: '247247', paybillAccount: 'ACC 1' }))).toBeNull();
  });

  it('checks bank accounts', () => {
    const bank = { method: 'bank' as const, bankName: 'Equity Bank', bankAccountName: 'Wanjiku Events' };
    expect(payoutDetailsError(details({ ...bank, bankAccountNumber: '0123 4567 8901' }))).toBeNull();
    expect(payoutDetailsError(details({ ...bank, bankAccountNumber: '12-34' }))?.field).toBe('bankAccountNumber');
    expect(payoutDetailsError(details({ ...bank, bankName: 'E', bankAccountNumber: '0123456789' }))?.field).toBe('bankName');
  });
});
