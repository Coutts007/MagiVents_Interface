import React, { useMemo, useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CreditCard,
  ShieldCheck
} from 'lucide-react';
import { formatKES } from '../../utils/format';

export interface MpesaPaymentState {
  method: 'mpesa' | 'card';
  mpesaMode: 'stk' | 'paybill';
  phoneNumber: string;
  receiptNumber: string;
  isVerified: boolean;
  totalInKes: number;
}

interface MpesaPaymentSectionProps {
  /** Amount due in Kenyan shillings */
  totalKes: number;
  attendeeName: string;
  onPaymentChange: (state: MpesaPaymentState) => void;
  state: MpesaPaymentState;
}

export const MpesaPaymentSection: React.FC<MpesaPaymentSectionProps> = ({
  totalKes,
  attendeeName,
  onPaymentChange,
  state
}) => {
  const totalInKes = Math.round(totalKes);
  const amountLabel = formatKES(totalInKes, null);

  const [stkStatus, setStkStatus] = useState<'idle' | 'initiating' | 'waiting_pin' | 'verified' | 'error'>('idle');
  const [phoneError, setPhoneError] = useState('');
  const [paybillCodeInput, setPaybillCodeInput] = useState('');
  const [paybillError, setPaybillError] = useState('');

  // Normalize phone number to standard 2547XXXXXXXX or 07XXXXXXXX
  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s-+]/g, '');
    if (!cleaned) return 'M-Pesa phone number is required.';
    if (cleaned.startsWith('254') && cleaned.length === 12) return '';
    if (cleaned.startsWith('0') && cleaned.length === 10) return '';
    if (cleaned.startsWith('7') && cleaned.length === 9) return '';
    if (cleaned.startsWith('1') && cleaned.length === 9) return '';
    return 'Enter a valid Safaricom number, e.g. 07XX XXX XXX or 2547XX XXX XXX.';
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneError('');
    onPaymentChange({
      ...state,
      phoneNumber: val,
      isVerified: false
    });
    if (stkStatus !== 'idle') {
      setStkStatus('idle');
    }
  };

  const handleInitiateStk = () => {
    const err = validatePhone(state.phoneNumber);
    if (err) {
      setPhoneError(err);
      return;
    }

    setStkStatus('initiating');

    // STK Push is simulated until the backend Daraja integration is in place
    setTimeout(() => {
      setStkStatus('waiting_pin');

      // Simulate attendee entering PIN on phone
      setTimeout(() => {
        // Simulated M-Pesa receipt number for the demo STK flow
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const randomReceipt =
          'SF' +
          alphabet[Math.floor(Math.random() * alphabet.length)] +
          Math.floor(1000 + Math.random() * 9000) +
          alphabet[Math.floor(Math.random() * alphabet.length)] +
          alphabet[Math.floor(Math.random() * alphabet.length)];

        setStkStatus('verified');
        onPaymentChange({
          ...state,
          receiptNumber: randomReceipt,
          isVerified: true,
          totalInKes
        });
      }, 3600);
    }, 1500);
  };

  const handleVerifyPaybill = () => {
    const trimmed = paybillCodeInput.trim().toUpperCase();
    if (!/^[A-Z0-9]{10}$/.test(trimmed)) {
      setPaybillError('Enter the 10-character confirmation code from your M-Pesa SMS (letters and numbers).');
      return;
    }

    setPaybillError('');
    onPaymentChange({
      ...state,
      receiptNumber: trimmed,
      isVerified: true,
      totalInKes
    });
  };

  // Stable for the lifetime of the form so the account number doesn't change on every render
  const accountRef = useMemo(
    () => `MAGI-${attendeeName.split(' ')[0]?.toUpperCase() || 'TICKET'}-${Math.floor(100 + Math.random() * 900)}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block">
          Choose Payment Method *
        </label>
        <span className="text-[11px] text-[#736B66] font-mono">
          Amount due: {amountLabel}
        </span>
      </div>

      {/* Payment Method Switcher (M-Pesa vs Card) */}
      <div className="grid grid-cols-2 gap-3">
        {/* M-Pesa Option */}
        <button
          type="button"
          onClick={() => {
            onPaymentChange({
              ...state,
              method: 'mpesa',
              totalInKes
            });
          }}
          className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-start gap-3 cursor-pointer select-none relative ${
            state.method === 'mpesa'
              ? 'border-[#00A34D] bg-[#00A34D]/5 shadow-sand-sm'
              : 'border-[#E2DDD5] bg-white hover:border-[#736B66]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              state.method === 'mpesa'
                ? 'bg-[#00A34D] text-white shadow-xs'
                : 'bg-[#F4F1EA] text-[#2A2421]'
            }`}
          >
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2A2421] flex items-center gap-1.5">
                M-Pesa
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#00A34D] text-white">
                Recommended
              </span>
            </div>
            <span className="text-[11px] text-[#736B66] block mt-0.5">
              {amountLabel} · STK Push / Paybill
            </span>
          </div>
        </button>

        {/* Card Option */}
        <button
          type="button"
          onClick={() => {
            onPaymentChange({
              ...state,
              method: 'card',
              isVerified: true
            });
          }}
          className={`p-3.5 rounded-2xl border-2 transition-all text-left flex items-start gap-3 cursor-pointer select-none ${
            state.method === 'card'
              ? 'border-[#C85A40] bg-[#C85A40]/5 shadow-sand-sm'
              : 'border-[#E2DDD5] bg-white hover:border-[#736B66]'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
              state.method === 'card'
                ? 'bg-[#C85A40] text-white shadow-xs'
                : 'bg-[#F4F1EA] text-[#2A2421]'
            }`}
          >
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#2A2421] block">
              Card (Visa / Mastercard)
            </span>
            <span className="text-[11px] text-[#736B66] block mt-0.5">
              {amountLabel}
            </span>
          </div>
        </button>
      </div>

      {/* M-Pesa Interactive Flow */}
      {state.method === 'mpesa' && (
        <div className="p-4 bg-[#FAF8F5] border border-[#00A34D]/30 rounded-2xl space-y-4 animate-in fade-in duration-200">
          {/* M-Pesa Header & Mode Selector */}
          <div className="flex items-center justify-between border-b border-[#E2DDD5] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#00A34D] animate-pulse" />
              <span className="text-xs font-bold text-[#2A2421]">
                Lipa na M-Pesa
              </span>
            </div>

            {/* Mode switch: STK Push vs Paybill Manual */}
            <div className="flex items-center gap-1 bg-[#EBE6DF] p-0.5 rounded-xl text-[11px]">
              <button
                type="button"
                onClick={() =>
                  onPaymentChange({ ...state, mpesaMode: 'stk', isVerified: stkStatus === 'verified' })
                }
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  state.mpesaMode === 'stk'
                    ? 'bg-white text-[#2A2421] font-semibold shadow-xs'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                STK Push
              </button>
              <button
                type="button"
                onClick={() =>
                  onPaymentChange({ ...state, mpesaMode: 'paybill' })
                }
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  state.mpesaMode === 'paybill'
                    ? 'bg-white text-[#2A2421] font-semibold shadow-xs'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                Paybill / Till
              </button>
            </div>
          </div>

          {/* Mode 1: Instant STK Push */}
          {state.mpesaMode === 'stk' ? (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  Safaricom M-Pesa Number *
                </label>
                <input
                  type="tel"
                  value={state.phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="Safaricom number, e.g. 07XX XXX XXX"
                  disabled={stkStatus === 'initiating' || stkStatus === 'waiting_pin'}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm font-mono text-[#2A2421] focus:outline-none focus:border-[#00A34D]"
                />
                <p className="text-[11px] text-[#736B66] mt-1">
                  We will send a payment request to this number. Approve it with your M-Pesa PIN.
                </p>
                {phoneError && (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {phoneError}
                  </p>
                )}
              </div>

              {/* Status Simulation Container */}
              {stkStatus === 'idle' && (
                <button
                  type="button"
                  onClick={handleInitiateStk}
                  className="w-full py-2.5 px-4 bg-[#00A34D] hover:bg-[#00873D] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  <Smartphone className="w-4 h-4" />
                  Send Payment Request ({amountLabel})
                </button>
              )}

              {stkStatus === 'initiating' && (
                <div className="p-3 bg-white rounded-xl border border-[#E2DDD5] flex items-center gap-3 animate-in fade-in">
                  <Loader2 className="w-5 h-5 text-[#00A34D] animate-spin shrink-0" />
                  <div className="text-xs text-[#2A2421]">
                    <span className="font-semibold block">Sending payment request…</span>
                    <span className="text-[#736B66] text-[11px]">This takes a few seconds</span>
                  </div>
                </div>
              )}

              {stkStatus === 'waiting_pin' && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <span>Payment request sent. Check your phone.</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    A request for <strong>{amountLabel}</strong> has been sent to{' '}
                    <strong>{state.phoneNumber}</strong>. Enter your M-Pesa PIN on your phone to approve it.
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-amber-600 font-mono pt-1">
                    <span>Paybill: 522522</span>
                    <span>Account: MagiVents</span>
                  </div>
                </div>
              )}

              {stkStatus === 'verified' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">
                        M-Pesa payment received
                      </span>
                      <span className="text-[11px] text-emerald-700 font-mono">
                        Receipt: {state.receiptNumber} · {amountLabel}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStkStatus('idle')}
                    className="text-[11px] text-[#736B66] hover:text-[#2A2421] underline cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Manual Paybill / Buy Goods */
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-xl border border-[#E2DDD5] text-xs space-y-2">
                <span className="font-semibold text-[#2A2421] block">
                  Pay with Paybill:
                </span>
                <ol className="list-decimal list-inside text-[11px] text-[#736B66] space-y-1">
                  <li>Go to M-Pesa menu &gt; <strong>Lipa na M-Pesa</strong> &gt; <strong>Paybill</strong></li>
                  <li>Enter Business No: <strong className="text-[#2A2421] font-mono">522522</strong></li>
                  <li>Enter Account No: <strong className="text-[#2A2421] font-mono">{accountRef}</strong></li>
                  <li>Enter Amount: <strong className="text-[#2A2421] font-mono">{amountLabel}</strong></li>
                  <li>Enter your M-Pesa PIN and confirm payment</li>
                </ol>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  M-Pesa Confirmation Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paybillCodeInput}
                    onChange={(e) => {
                      setPaybillCodeInput(e.target.value);
                      setPaybillError('');
                    }}
                    placeholder="10-character code from the M-Pesa SMS"
                    className="flex-1 px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs font-mono uppercase text-[#2A2421] focus:outline-none focus:border-[#00A34D]"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPaybill}
                    className="px-4 py-2 bg-[#00A34D] hover:bg-[#00873D] text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Confirm Code
                  </button>
                </div>
                {paybillError && (
                  <p className="text-[11px] text-red-600 mt-1">{paybillError}</p>
                )}
                {state.isVerified && state.receiptNumber && (
                  <p className="text-[11px] text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Code {state.receiptNumber} recorded for {amountLabel}.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-[#736B66] pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A34D] shrink-0" />
            <span>Keep your M-Pesa confirmation SMS until after the event.</span>
          </div>
        </div>
      )}
    </div>
  );
};
