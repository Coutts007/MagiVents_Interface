import React, { useEffect, useState } from 'react';
import { AlertCircle, CreditCard, ExternalLink, Loader2, RefreshCw, Smartphone, Timer } from 'lucide-react';
import { BookingWithPayment } from '../../types';
import { PublicConfig } from '../../services/api';
import { checkoutStage, failureMessage, formatCountdown, paymentAction } from '../../utils/checkout';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { MpesaPaymentSection, PaymentChoice } from './MpesaPaymentSection';

export interface PaymentStatusPanelProps {
  booking: BookingWithPayment;
  config: PublicConfig | null;
  /** Starts a new attempt for the same booking (never a second booking) */
  onRetry: (choice: PaymentChoice) => void;
  isRetrying: boolean;
  retryError: string | null;
  /** The choice used for the current attempt, offered again on retry */
  lastChoice: PaymentChoice;
  phoneError: string | null;
}

/** Seconds until the hold runs out, ticking every second */
function useSecondsLeft(expiresAt: string | null | undefined): number | null {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  return expiresAt ? Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000)) : null;
}

/** Shown after a paid booking is submitted, until the server says it is confirmed, failed or expired. */
export const PaymentStatusPanel: React.FC<PaymentStatusPanelProps> = ({
  booking,
  config,
  onRetry,
  isRetrying,
  retryError,
  lastChoice,
  phoneError
}) => {
  const stage = checkoutStage(booking);
  const action = paymentAction(booking);
  const secondsLeft = useSecondsLeft(stage === 'awaiting-payment' ? booking.expiresAt : null);
  const [choice, setChoice] = useState<PaymentChoice>(lastChoice);
  const [isChangingMethod, setIsChangingMethod] = useState(false);
  const amount = formatKES(booking.totalPrice, null);
  const simulated = booking.payment?.instructions.simulated || booking.payment?.provider === 'simulated';

  // The hold for this attempt is over; a new attempt can start again
  useEffect(() => {
    setChoice(lastChoice);
  }, [lastChoice]);

  if (stage === 'failed' || stage === 'expired') {
    return (
      <div className="space-y-5">
        <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div className="text-sm text-red-900 space-y-1">
            <p className="font-semibold">{stage === 'expired' ? 'Time ran out' : 'Payment not completed'}</p>
            <p>{failureMessage(booking)}</p>
            <p className="text-xs text-red-800">Your booking details are kept, so you can try again below.</p>
          </div>
        </div>

        <MpesaPaymentSection
          totalKes={booking.totalPrice}
          value={choice}
          onChange={setChoice}
          config={config}
          phoneError={phoneError}
          disabled={isRetrying}
        />

        {retryError && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            {retryError}
          </div>
        )}
        <Button
          variant="primary"
          fullWidth
          size="lg"
          icon={<RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />}
          onClick={() => onRetry(choice)}
          disabled={isRetrying}
        >
          {isRetrying ? 'Starting payment…' : `Try again · ${amount}`}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hold countdown */}
      {secondsLeft !== null && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-[#E9E2D6] border border-[#D8CDBC]">
          <span className="flex items-center gap-2 text-xs text-[#675A50]">
            <Timer className="w-4 h-4 text-[#8A4F33]" />
            Your {booking.quantity === 1 ? 'ticket is' : 'tickets are'} held for
          </span>
          <span
            className={`font-mono text-base font-bold tabular-nums ${secondsLeft < 60 ? 'text-red-700' : 'text-[#1E1814]'}`}
            aria-live="off"
          >
            {formatCountdown(secondsLeft)}
          </span>
        </div>
      )}

      {simulated && (
        <p className="text-[11px] p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          Demo mode: this payment is simulated and completes by itself in a few seconds.
        </p>
      )}

      {action === 'phone-prompt' && (
        <div className="p-5 rounded-2xl bg-[#00A34D]/5 border border-[#00A34D]/30 space-y-2" role="status">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1814]">
            <Smartphone className="w-5 h-5 text-[#00A34D]" />
            Check your phone
          </div>
          <p className="text-sm text-[#675A50] leading-relaxed">
            We sent an M-Pesa request for <strong className="text-[#1E1814]">{amount}</strong>
            {booking.mpesaPhoneNumber ? (
              <>
                {' '}to <strong className="text-[#1E1814] font-mono">{booking.mpesaPhoneNumber}</strong>
              </>
            ) : null}
            . Enter your M-Pesa PIN to approve it.
          </p>
        </div>
      )}

      {action === 'paybill' && (
        <div className="p-5 rounded-2xl bg-[#00A34D]/5 border border-[#00A34D]/30 space-y-3">
          <p className="text-sm font-semibold text-[#1E1814]">Pay with M-Pesa Paybill</p>
          <ol className="list-decimal list-inside text-sm text-[#675A50] space-y-1.5">
            <li>
              M-Pesa menu &gt; <strong className="text-[#1E1814]">Lipa na M-Pesa</strong> &gt;{' '}
              <strong className="text-[#1E1814]">Paybill</strong>
            </li>
            <li>
              Business number:{' '}
              <strong className="font-mono text-[#1E1814]">
                {booking.payment?.instructions.paybill || config?.mpesaPaybill}
              </strong>
            </li>
            <li>
              Account number: <strong className="font-mono text-[#1E1814]">{booking.payment?.instructions.accountNumber}</strong>
            </li>
            <li>
              Amount: <strong className="font-mono text-[#1E1814]">{amount}</strong> exactly
            </li>
            <li>Enter your PIN and send</li>
          </ol>
          <p className="text-[11px] text-[#675A50]">Your ticket appears here as soon as M-Pesa confirms the payment.</p>
        </div>
      )}

      {action === 'card-redirect' && booking.payment?.authorizationUrl && (
        <div className="p-5 rounded-2xl bg-[#8A4F33]/5 border border-[#8A4F33]/30 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#1E1814]">
            <CreditCard className="w-5 h-5 text-[#8A4F33]" />
            Pay by card on Paystack
          </div>
          <p className="text-sm text-[#675A50]">You will come back here once the payment is done.</p>
          <a
            href={booking.payment.authorizationUrl}
            className="btn-brand inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white"
          >
            Continue to secure payment
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {action === 'card-processing' && (
        <div className="p-5 rounded-2xl bg-[#8A4F33]/5 border border-[#8A4F33]/30 flex items-center gap-2 text-sm text-[#1E1814]" role="status">
          <CreditCard className="w-5 h-5 text-[#8A4F33]" />
          Processing your card payment…
        </div>
      )}

      <div className="flex items-center justify-center gap-2 text-xs text-[#675A50]" role="status">
        <Loader2 className="w-4 h-4 animate-spin text-[#8A4F33]" />
        Waiting for confirmation from {booking.payment?.method === 'card' ? 'the card processor' : 'M-Pesa'}…
      </div>

      {!isChangingMethod ? (
        <button
          type="button"
          onClick={() => setIsChangingMethod(true)}
          className="block mx-auto text-xs text-[#675A50] hover:text-[#1E1814] underline cursor-pointer"
        >
          Didn't get it? Send again or pay another way
        </button>
      ) : (
        <div className="space-y-4 pt-2 border-t border-[#D8CDBC]">
          <MpesaPaymentSection
            totalKes={booking.totalPrice}
            value={choice}
            onChange={setChoice}
            config={config}
            phoneError={phoneError}
            disabled={isRetrying}
          />
          {retryError && (
            <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
              {retryError}
            </div>
          )}
          <Button variant="primary" fullWidth onClick={() => onRetry(choice)} disabled={isRetrying}>
            {isRetrying ? 'Starting payment…' : 'Start a new payment'}
          </Button>
          <p className="text-[11px] text-[#675A50] text-center">
            Only one payment confirms the booking. If an earlier request also goes through, the organizer is
            told to refund it.
          </p>
        </div>
      )}
    </div>
  );
};
