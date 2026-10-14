import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Smartphone } from 'lucide-react';
import { ListingFeeState, getApiErrorMessage, getPublicConfig, listingFeeApi } from '../../services/api';
import { formatKES } from '../../utils/format';
import { phoneError, pollDelay } from '../../utils/checkout';
import { Button } from '../ui/Button';

export interface PayListingFeePanelProps {
  eventId: string;
  eventTitle: string;
  /** Set to pay the difference for moving a paid event to a dearer category */
  targetCategory?: string;
  /** The amount the server said is due (shown until the first fetch completes) */
  amountHint?: number;
  /** Called once the server confirms the fee is settled (and the event published, or the category changed) */
  onSettled: (state: ListingFeeState) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';

/**
 * "Pay KSh X to publish": the platform's payment details and an M-Pesa payment, confirmed by the server.
 * The browser never decides that the fee was paid; it polls the server until the payment is settled.
 */
export const PayListingFeePanel: React.FC<PayListingFeePanelProps> = ({
  eventId,
  eventTitle,
  targetCategory,
  amountHint,
  onSettled,
  onCancel
}) => {
  const [state, setState] = useState<ListingFeeState | null>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSimulated, setIsSimulated] = useState(false);
  const settledRef = useRef(false);
  const attemptRef = useRef(0);

  const isUpgrade = Boolean(targetCategory);
  const isSettled = (s: ListingFeeState) =>
    isUpgrade ? s.category === targetCategory : s.amountDue === 0 && s.status !== 'pending';
  const isPending = state?.status === 'pending' || state?.payment?.status === 'pending';

  const accept = (next: ListingFeeState) => {
    setState(next);
    if (!settledRef.current && isSettled(next) && next.payment?.status !== 'pending') {
      settledRef.current = true;
      onSettled(next);
    }
  };

  useEffect(() => {
    getPublicConfig()
      .then((config) => setIsSimulated(config.paymentsMode === 'simulated'))
      .catch(() => undefined);
    listingFeeApi
      .get(eventId)
      .then(accept)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load the listing fee.')));
  }, [eventId]);

  // Ask the server again while a payment is being confirmed
  useEffect(() => {
    if (!isPending || settledRef.current) return;
    const timer = setTimeout(() => {
      attemptRef.current += 1;
      listingFeeApi
        .get(eventId)
        .then(accept)
        .catch(() => undefined);
    }, pollDelay(attemptRef.current));
    return () => clearTimeout(timer);
  }, [state, isPending, eventId]);

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = phoneError(phone);
    if (problem) {
      setError(problem);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    attemptRef.current = 0;
    try {
      accept(await listingFeeApi.pay(eventId, phone, targetCategory));
    } catch (err) {
      setError(getApiErrorMessage(err, 'The payment could not be started.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const due = isUpgrade ? amountHint ?? 0 : state?.amountDue ?? amountHint ?? 0;
  const platform = state?.platform;
  const failed = state?.payment?.status === 'failed' && !isSettled(state);

  if (state && isSettled(state)) {
    return (
      <div role="status" className="space-y-4 text-center py-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" aria-hidden="true" />
        <h4 className="font-serif text-xl text-[#1E1814]">
          {isUpgrade ? 'Category changed' : state.eventStatus === 'draft' ? 'Listing fee settled' : 'Your event is published'}
        </h4>
        <p className="text-sm text-[#675A50]">
          {isUpgrade
            ? `"${eventTitle}" is now listed under ${targetCategory}.`
            : state.eventStatus === 'draft'
              ? 'You can publish the event whenever you are ready; the fee will not be charged again.'
              : `"${eventTitle}" is live on MagiVents.`}
        </p>
        <Button variant="primary" onClick={onCancel}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="p-5 rounded-2xl bg-[#E9E2D6]/60 border border-[#D8CDBC]">
        <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold block">
          {isUpgrade ? 'Category change' : 'Listing fee'}
        </span>
        <p className="font-serif text-3xl font-medium text-[#1E1814] tabular-nums mt-1">{formatKES(due, 'KSh 0')}</p>
        <p className="text-xs text-[#675A50] mt-1 leading-relaxed">
          {isUpgrade
            ? `The difference between the listing fee already paid and the fee for ${targetCategory}. The category changes once the payment is confirmed.`
            : `MagiVents charges a one-off listing fee to publish "${eventTitle}". It is charged once: unpublishing and republishing is free.`}
        </p>
      </div>

      {platform && (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-[#D8CDBC] bg-ivory">
            <dt className="uppercase tracking-wider font-semibold text-[#675A50]">{platform.methodLabel}</dt>
            <dd className="font-serif text-lg text-[#1E1814] tabular-nums">{platform.businessNumber || 'Not set yet'}</dd>
          </div>
          {platform.method === 'paybill' && (
            <div className="p-3 rounded-xl border border-[#D8CDBC] bg-ivory">
              <dt className="uppercase tracking-wider font-semibold text-[#675A50]">Account number</dt>
              <dd className="font-serif text-lg text-[#1E1814] tabular-nums">{platform.accountNumber}</dd>
            </div>
          )}
          {platform.accountName && (
            <div className="p-3 rounded-xl border border-[#D8CDBC] bg-ivory sm:col-span-2">
              <dt className="uppercase tracking-wider font-semibold text-[#675A50]">Account name</dt>
              <dd className="text-sm text-[#1E1814]">{platform.accountName}</dd>
            </div>
          )}
          {platform.instructions && (
            <div className="sm:col-span-2 text-[#675A50] leading-relaxed whitespace-pre-line">{platform.instructions}</div>
          )}
          <div className="sm:col-span-2 text-[#675A50]">
            Your reference: <strong className="text-[#1E1814] tabular-nums">{state?.reference}</strong>
          </div>
        </dl>
      )}

      {error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {failed && !error && (
        <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
          The payment did not go through: {state?.payment?.failureReason || 'it was not completed'}. You can try again.
        </div>
      )}

      {state && !state.onlinePayment ? (
        <div className="p-4 rounded-xl border border-[#D8CDBC] bg-ivory text-xs text-[#675A50] leading-relaxed">
          Pay with the details above and quote your reference. An administrator confirms the payment, and your event
          is published as soon as they do.
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => listingFeeApi.get(eventId).then(accept)}>
              Check again
            </Button>
          </div>
        </div>
      ) : isPending ? (
        <div role="status" aria-live="polite" className="p-4 rounded-xl border border-[#D8CDBC] bg-ivory flex items-start gap-3 text-sm">
          <Loader2 className="w-5 h-5 text-[#8A4F33] animate-spin shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-[#1E1814]">Check your phone</p>
            <p className="text-xs text-[#675A50] mt-0.5">
              Approve the M-Pesa request with your PIN. This page updates by itself once the payment is confirmed.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={pay} noValidate className="space-y-3">
          <label htmlFor="listing-fee-phone" className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block">
            M-Pesa number to pay from
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 text-[#675A50] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="listing-fee-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0712 345 678"
              className={`${inputClass} pl-9`}
            />
          </div>
          {isSimulated && (
            <p className="text-[11px] text-[#675A50]">
              Demo mode: no real money moves. A number ending in 1032 shows a failed payment.
            </p>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onCancel}>
              {isUpgrade ? 'Keep the current category' : 'Pay later'}
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting || !state}>
              {isSubmitting ? 'Starting…' : `Pay ${formatKES(due, 'KSh 0')}${isUpgrade ? '' : ' to publish'}`}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
