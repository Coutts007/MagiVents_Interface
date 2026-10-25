import React from 'react';
import { AlertCircle, CreditCard, ShieldCheck, Smartphone } from 'lucide-react';
import { formatKES } from '../../utils/format';
import { PublicConfig } from '../../services/api';

/** What the attendee chose; the payment itself happens on the server after the booking is submitted. */
export interface PaymentChoice {
  method: 'mpesa' | 'card';
  mpesaMode: 'stk' | 'paybill';
  phoneNumber: string;
}

export const INITIAL_PAYMENT_CHOICE: PaymentChoice = { method: 'mpesa', mpesaMode: 'stk', phoneNumber: '' };

interface MpesaPaymentSectionProps {
  /** Amount due in Kenyan shillings */
  totalKes: number;
  value: PaymentChoice;
  onChange: (value: PaymentChoice) => void;
  /** Server configuration: which methods work, and whether payments are simulated */
  config: PublicConfig | null;
  /** Shown under the phone field */
  phoneError?: string | null;
  disabled?: boolean;
}

/** Choose M-Pesa (prompt on the phone, or Paybill) or card. Nothing is charged until the booking is submitted. */
export const MpesaPaymentSection: React.FC<MpesaPaymentSectionProps> = ({
  totalKes,
  value,
  onChange,
  config,
  phoneError,
  disabled = false
}) => {
  const amountLabel = formatKES(Math.round(totalKes), null);
  const methods = config?.paymentMethods ?? { mpesaStk: true, mpesaPaybill: true, card: true };
  const mpesaAvailable = methods.mpesaStk || methods.mpesaPaybill;

  const choose = (next: Partial<PaymentChoice>) => onChange({ ...value, ...next });

  const methodCard = (
    method: PaymentChoice['method'],
    available: boolean,
    icon: React.ReactNode,
    title: string,
    detail: string,
    accent: string
  ) => {
    const selected = value.method === method;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        disabled={!available || disabled}
        onClick={() =>
          choose(
            method === 'mpesa'
              ? { method, mpesaMode: methods.mpesaStk ? value.mpesaMode : 'paybill' }
              : { method }
          )
        }
        className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-start gap-3 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed ${
          selected ? `${accent} shadow-sand-sm` : 'border-[#D8CDBC] bg-ivory hover:border-[#675A50]'
        }`}
      >
        {icon}
        <div className="min-w-0 flex-1">
          <span className="text-xs font-bold text-[#1E1814] block">{title}</span>
          <span className="text-[11px] text-[#675A50] block mt-0.5">{available ? detail : 'Not available right now'}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block" id="payment-method-label">
          Payment method *
        </span>
        <span className="text-[11px] text-[#675A50] font-mono">Amount due: {amountLabel}</span>
      </div>

      {config?.paymentsMode === 'simulated' && (
        <p className="text-[11px] p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          Demo mode: payments are simulated and no money is taken. Numbers ending in 1032 simulate a cancelled
          M-Pesa request.
        </p>
      )}

      <div role="radiogroup" aria-labelledby="payment-method-label" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {methodCard(
          'mpesa',
          mpesaAvailable,
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${value.method === 'mpesa' ? 'bg-[#00A34D] text-white' : 'bg-[#E9E2D6] text-[#1E1814]'}`}>
            <Smartphone className="w-5 h-5" />
          </div>,
          'M-Pesa',
          `${amountLabel} · prompt on your phone or Paybill`,
          'border-[#00A34D] bg-[#00A34D]/5'
        )}
        {methodCard(
          'card',
          methods.card,
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${value.method === 'card' ? 'bg-[#8A4F33] text-white' : 'bg-[#E9E2D6] text-[#1E1814]'}`}>
            <CreditCard className="w-5 h-5" />
          </div>,
          'Card (Visa / Mastercard)',
          `${amountLabel} · secure Paystack checkout`,
          'border-[#8A4F33] bg-[#8A4F33]/5'
        )}
      </div>

      {value.method === 'mpesa' && mpesaAvailable && (
        <div className="p-4 bg-[#EFE8DD] border border-[#00A34D]/30 rounded-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8CDBC] pb-3">
            <span className="text-xs font-bold text-[#1E1814]">Lipa na M-Pesa</span>
            <div role="radiogroup" aria-label="M-Pesa option" className="flex items-center gap-1 bg-[#DFD6C8] p-0.5 rounded-xl text-[11px]">
              {([
                ['stk', 'Prompt on my phone', methods.mpesaStk],
                ['paybill', 'Paybill', methods.mpesaPaybill]
              ] as const).map(([mode, label, available]) => (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={value.mpesaMode === mode}
                  disabled={!available || disabled}
                  onClick={() => choose({ mpesaMode: mode })}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                    value.mpesaMode === mode
                      ? 'bg-ivory text-[#1E1814] font-semibold shadow-xs'
                      : 'text-[#675A50] hover:text-[#1E1814]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {value.mpesaMode === 'stk' ? (
            <div>
              <label htmlFor="mpesa-phone" className="text-[11px] font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                M-Pesa phone number *
              </label>
              <input
                id="mpesa-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={value.phoneNumber}
                onChange={(e) => choose({ phoneNumber: e.target.value })}
                placeholder="e.g. 0712 345 678"
                disabled={disabled}
                aria-invalid={Boolean(phoneError)}
                className="w-full px-3.5 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm font-mono text-[#1E1814] focus:outline-none focus:border-[#00A34D]"
              />
              <p className="text-[11px] text-[#675A50] mt-1">
                After you confirm, a payment request for {amountLabel} pops up on this phone. Enter your M-Pesa PIN to pay.
              </p>
              {phoneError && (
                <p role="alert" className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  {phoneError}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-[#675A50] leading-relaxed">
              After you confirm, we show the Paybill number and your own account number. Pay exactly {amountLabel} from
              the M-Pesa menu and your ticket is issued as soon as M-Pesa tells us.
            </p>
          )}
        </div>
      )}

      {value.method === 'card' && methods.card && (
        <p className="text-[11px] text-[#675A50] p-3 rounded-xl bg-[#EFE8DD] border border-[#D8CDBC]">
          After you confirm, you pay on Paystack's secure page and come straight back here. MagiVents never sees your
          card details.
        </p>
      )}

      <div className="flex items-center gap-1.5 text-[11px] text-[#675A50]">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00A34D]" />
        <span>Your tickets are held for {config?.paymentHoldMinutes ?? 2} minutes while you pay.</span>
      </div>
    </div>
  );
};
