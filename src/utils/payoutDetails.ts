/**
 * Organizer payment details: where MagiVents pays out an organizer's ticket money. The server validates the
 * same rules; these checks only give quicker feedback.
 */
export type PayoutMethod = 'mpesa_phone' | 'till' | 'paybill' | 'bank';

export interface PayoutDetailsInput {
  method: PayoutMethod;
  phoneNumber: string;
  tillNumber: string;
  paybillNumber: string;
  paybillAccount: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
}

export interface PayoutDetails extends PayoutDetailsInput {
  methodLabel: string;
  /** One line, e.g. "M-Pesa 0712 345 678" */
  summary: string;
  scope: 'default' | 'event';
  updatedAt: string | null;
}

export const PAYOUT_METHODS: { id: PayoutMethod; label: string; hint: string }[] = [
  { id: 'mpesa_phone', label: 'M-Pesa number', hint: 'A Safaricom line registered for M-Pesa' },
  { id: 'till', label: 'Till number', hint: 'Lipa na M-Pesa Buy Goods' },
  { id: 'paybill', label: 'Paybill', hint: 'Business number and account number' },
  { id: 'bank', label: 'Bank account', hint: 'Bank, account name and number' }
];

export const EMPTY_PAYOUT_DETAILS: PayoutDetailsInput = {
  method: 'mpesa_phone',
  phoneNumber: '',
  tillNumber: '',
  paybillNumber: '',
  paybillAccount: '',
  bankName: '',
  bankAccountName: '',
  bankAccountNumber: ''
};

export function toPayoutInput(details: PayoutDetails | null | undefined): PayoutDetailsInput {
  if (!details) return { ...EMPTY_PAYOUT_DETAILS };
  const { method, phoneNumber, tillNumber, paybillNumber, paybillAccount, bankName, bankAccountName, bankAccountNumber } =
    details;
  return { method, phoneNumber, tillNumber, paybillNumber, paybillAccount, bankName, bankAccountName, bankAccountNumber };
}

const compact = (value: string) => value.replace(/[\s-]/g, '');

/** The first problem with the details, keyed by field, or null when they look right. */
export function payoutDetailsError(input: PayoutDetailsInput): { field: keyof PayoutDetailsInput; message: string } | null {
  switch (input.method) {
    case 'mpesa_phone': {
      let digits = input.phoneNumber.replace(/[\s\-+()]/g, '');
      if (digits.startsWith('254')) digits = digits.slice(3);
      else if (digits.startsWith('0')) digits = digits.slice(1);
      return /^[71]\d{8}$/.test(digits)
        ? null
        : { field: 'phoneNumber', message: 'Enter a valid M-Pesa number, e.g. 0712 345 678.' };
    }
    case 'till':
      return /^\d{5,7}$/.test(compact(input.tillNumber))
        ? null
        : { field: 'tillNumber', message: 'A Till number has 5 to 7 digits, e.g. 5123456.' };
    case 'paybill':
      if (!/^\d{5,7}$/.test(compact(input.paybillNumber))) {
        return { field: 'paybillNumber', message: 'A Paybill (business) number has 5 to 7 digits, e.g. 247247.' };
      }
      return /^[A-Za-z0-9][A-Za-z0-9 -]{0,19}$/.test(input.paybillAccount.trim())
        ? null
        : { field: 'paybillAccount', message: 'Enter the account number for the Paybill (up to 20 letters or digits).' };
    case 'bank':
      if (input.bankName.trim().length < 2) return { field: 'bankName', message: 'Enter the name of the bank, e.g. Equity Bank.' };
      if (input.bankAccountName.trim().length < 2) {
        return { field: 'bankAccountName', message: 'Enter the name the bank account is held in.' };
      }
      return /^\d{6,20}$/.test(compact(input.bankAccountNumber))
        ? null
        : { field: 'bankAccountNumber', message: 'A bank account number has 6 to 20 digits.' };
  }
}
