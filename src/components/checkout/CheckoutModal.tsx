import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  MapPin,
  CheckCircle,
  CalendarPlus,
  Info,
  Share2,
  Check,
  Smartphone,
  Printer,
  Mail,
  Ticket
} from 'lucide-react';
import { BookingWithPayment, EventItem, TicketTier } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  BookingRequest,
  PublicConfig,
  bookingsApi,
  getApiErrorMessage,
  getPublicConfig,
  promoApi
} from '../../services/api';
import { checkoutStage, normalizeKenyanPhone, phoneError as getPhoneError, pollDelay } from '../../utils/checkout';
import { formatKES } from '../../utils/format';
import { admitsLabel, tierPriceAt } from '../../utils/tiers';
import { useNow } from '../../utils/useNow';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { INITIAL_PAYMENT_CHOICE, MpesaPaymentSection, PaymentChoice } from './MpesaPaymentSection';
import { PaymentStatusPanel } from './PaymentStatusPanel';
import { PrintableTicketModal } from '../ticket/PrintableTicketModal';
import { TicketQRCode } from '../ui/TicketQRCode';
import { EmailConfirmationModal } from '../ticket/EmailConfirmationModal';

/** After an M-Pesa payment is shown as not completed, check for a late success every 5 s for 5 minutes */
const LATE_PAYMENT_DELAY_MS = 5000;
const LATE_PAYMENT_CHECKS = 60;

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  tier: TicketTier | null;
  quantity: number;
  /** Creates the booking on the server: free ones come back confirmed, paid ones pending */
  onCompleteBooking: (request: BookingRequest) => Promise<BookingWithPayment>;
  /** Called once a booking is confirmed (straight away, or after its payment) */
  onBookingConfirmed: (booking: BookingWithPayment) => void;
  onShareEvent?: (event: EventItem) => void;
  /** Reopens checkout for an existing booking, e.g. after returning from the card payment page */
  resumeBookingId?: string | null;
  /** Looks up the booked event when checkout was reopened from a booking */
  findEvent?: (eventId: string) => EventItem | undefined;
}

/** Builds an .ics calendar file for the event (all-day when the time can't be parsed). */
function buildCalendarFile(event: EventItem): string {
  const day = event.isoDate.replace(/-/g, '');
  const times = event.time.match(/(\d{1,2}):(\d{2})/g) || [];
  const toStamp = (t: string) => `${day}T${t.replace(':', '').padStart(4, '0')}00`;
  const escape = (text: string) => text.replace(/[\\,;]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');

  const [start, end] = times;
  const when = start
    ? [`DTSTART;TZID=Africa/Nairobi:${toStamp(start)}`, `DTEND;TZID=Africa/Nairobi:${toStamp(end ?? start)}`]
    : [`DTSTART;VALUE=DATE:${day}`];

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MagiVents//Tickets//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@magivents`,
    ...when,
    `SUMMARY:${escape(event.title)}`,
    `LOCATION:${escape([event.venue.name, event.venue.address, event.venue.city].filter(Boolean).join(', '))}`,
    `DESCRIPTION:${escape(event.description)}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  tier,
  quantity,
  onCompleteBooking,
  onBookingConfirmed,
  onShareEvent,
  resumeBookingId = null,
  findEvent
}) => {
  const { user } = useAuth();
  // Keeps the shown price right if a flash sale ends while checkout is open
  const now = useNow(isOpen && tier?.salePrice !== null && tier?.salePrice !== undefined);
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percentOff: number } | null>(null);
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modals for Ticket Printing & Email Confirmation
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Payment: what the attendee chose, and the booking as the server last reported it
  const [config, setConfig] = useState<PublicConfig | null>(null);
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>(INITIAL_PAYMENT_CHOICE);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingWithPayment | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const reportedConfirmedRef = useRef<string | null>(null);
  const confirmedBooking = booking?.status === 'confirmed' ? booking : null;

  useEffect(() => {
    if (user && isOpen) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    getPublicConfig()
      .then((cfg) => {
        setConfig(cfg);
        // Start on a method the server can actually take
        setPaymentChoice((current) => {
          const methods = cfg.paymentMethods;
          if (current.method === 'mpesa' && !methods.mpesaStk && !methods.mpesaPaybill && methods.card) {
            return { ...current, method: 'card' };
          }
          if (current.method === 'mpesa' && current.mpesaMode === 'stk' && !methods.mpesaStk && methods.mpesaPaybill) {
            return { ...current, mpesaMode: 'paybill' };
          }
          return current;
        });
      })
      .catch(() => setConfig(null));
  }, [isOpen]);

  /** Moves to the right step for what the server says about the booking. */
  const showBooking = (next: BookingWithPayment) => {
    setBooking(next);
    if (checkoutStage(next) === 'confirmed') {
      setStep('success');
      if (reportedConfirmedRef.current !== next.id) {
        reportedConfirmedRef.current = next.id;
        onBookingConfirmed(next);
      }
    } else {
      setStep('payment');
    }
  };

  // Reopened after the card payment page, or from a booking link
  useEffect(() => {
    if (!isOpen || !resumeBookingId) return;
    bookingsApi
      .status(resumeBookingId)
      .then(showBooking)
      .catch((err) => {
        setStep('payment');
        setRetryError(getApiErrorMessage(err, 'This booking could not be found.'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, resumeBookingId]);

  // Poll the server while the payment is pending; the browser never decides a payment succeeded
  const pendingId = booking && checkoutStage(booking) === 'awaiting-payment' ? booking.id : null;
  const paymentId = booking?.payment?.id;
  useEffect(() => {
    if (!isOpen || !pendingId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const poll = () => {
      timer = setTimeout(async () => {
        try {
          const next = await bookingsApi.status(pendingId);
          if (cancelled) return;
          showBooking(next);
          if (checkoutStage(next) !== 'awaiting-payment') return;
        } catch {
          // A dropped connection is retried on the next tick
        }
        attempt += 1;
        if (!cancelled) poll();
      }, pollDelay(attempt));
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pendingId, paymentId]);

  // An M-Pesa payment shown as not completed can still succeed: the phone's answer may reach the server after
  // the status check gave up. Keep looking for a few minutes so the ticket appears without a reload.
  const lateMpesaId =
    booking && booking.payment?.method === 'mpesa' && ['failed', 'expired'].includes(checkoutStage(booking))
      ? booking.id
      : null;
  useEffect(() => {
    if (!isOpen || !lateMpesaId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    let attempt = 0;
    const poll = () => {
      timer = setTimeout(async () => {
        try {
          const next = await bookingsApi.status(lateMpesaId);
          if (cancelled) return;
          if (checkoutStage(next) === 'confirmed') {
            showBooking(next);
            return;
          }
        } catch {
          // Retried on the next tick
        }
        attempt += 1;
        if (!cancelled && attempt < LATE_PAYMENT_CHECKS) poll();
      }, LATE_PAYMENT_DELAY_MS);
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lateMpesaId, paymentId]);

  const handleRetry = async (choice: PaymentChoice) => {
    if (!booking) return;
    const problem = choice.method === 'mpesa' && choice.mpesaMode === 'stk' ? getPhoneError(choice.phoneNumber) : null;
    setPhoneError(problem);
    if (problem) return;
    setPaymentChoice(choice);
    setIsRetrying(true);
    setRetryError(null);
    try {
      showBooking(
        await bookingsApi.pay(booking.id, {
          paymentMethod: choice.method,
          mpesaMode: choice.mpesaMode,
          mpesaPhoneNumber:
            choice.method === 'mpesa' && choice.mpesaMode === 'stk'
              ? normalizeKenyanPhone(choice.phoneNumber) || undefined
              : undefined
        })
      );
    } catch (err) {
      setRetryError(getApiErrorMessage(err, 'The payment could not be started.'));
    } finally {
      setIsRetrying(false);
    }
  };

  if (!isOpen) return null;
  if (!booking && (!event || !tier)) return null;

  // All amounts are Kenyan shillings; the server recomputes them (and decides the flash-sale price) when booking
  const tierPrice = tier ? tierPriceAt(tier, now) : { price: 0, onSale: false };
  const baseTotal = tierPrice.price * quantity;
  const finalTotal = Math.max(0, baseTotal - discount);
  const isFree = Boolean(event?.isFree) || baseTotal === 0;
  // The event behind the ticket, also when checkout was reopened from a booking link
  const ticketEvent = event ?? (booking ? findEvent?.(booking.eventId) ?? null : null);

  // The server checks the code and works out the discount; the booking re-checks it
  const applyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !tier) return;
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Enter a promo code first.');
      return;
    }
    setIsCheckingPromo(true);
    try {
      const result = await promoApi.validate(code, event.id, tier.id, quantity);
      setDiscount(result.discount ?? 0);
      setAppliedPromo({ code: result.code, percentOff: result.percentOff });
      setPromoError('');
    } catch (err) {
      setDiscount(0);
      setAppliedPromo(null);
      setPromoError(getApiErrorMessage(err, 'This promo code is not valid.'));
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !tier || !fullName.trim() || !email.trim() || isSubmitting) return;

    const paying = !isFree && finalTotal > 0;
    const usesPhone = paying && paymentChoice.method === 'mpesa' && paymentChoice.mpesaMode === 'stk';
    const problem = usesPhone ? getPhoneError(paymentChoice.phoneNumber) : null;
    setPhoneError(problem);
    if (problem) {
      setSubmitError(problem);
      return;
    }

    // Pricing, availability, ticket code and payment state are all decided by the server
    const request: BookingRequest = {
      eventId: event.id,
      tierId: tier.id,
      tierName: tier.name,
      quantity,
      attendeeName: fullName.trim(),
      attendeeEmail: email.trim(),
      paymentMethod: paying ? paymentChoice.method : 'free',
      mpesaMode: paying && paymentChoice.method === 'mpesa' ? paymentChoice.mpesaMode : undefined,
      mpesaPhoneNumber: usesPhone ? normalizeKenyanPhone(paymentChoice.phoneNumber) || undefined : undefined,
      notes: notes.trim() || undefined,
      promoCode: !isFree && appliedPromo ? appliedPromo.code : undefined
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await onCompleteBooking(request);
      showBooking(created);
      // Card payments continue on Paystack's page, which sends the attendee back here
      if (created.status === 'pending' && created.payment?.authorizationUrl) {
        window.location.assign(created.payment.authorizationUrl);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Your booking could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCalendar = () => {
    if (!ticketEvent) return;
    const blob = new Blob([buildCalendarFile(ticketEvent)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${ticketEvent.id}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setCalendarAdded(true);
    setTimeout(() => setCalendarAdded(false), 3000);
  };

  const handleClose = () => {
    setStep('form');
    setFullName('');
    setEmail('');
    setNotes('');
    setPromoCode('');
    setDiscount(0);
    setAppliedPromo(null);
    setPromoError('');
    setSubmitError(null);
    setBooking(null);
    setRetryError(null);
    setPhoneError(null);
    setPaymentChoice(INITIAL_PAYMENT_CHOICE);
    onClose();
  };

  const bookingIsFree = confirmedBooking?.paymentMethod === 'free' || confirmedBooking?.totalPrice === 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={
          step === 'form' ? (isFree ? 'Register for this event' : 'Get your tickets') : step === 'payment' ? 'Complete your payment' : 'Your ticket'
        }
        subtitle={
          step === 'form'
            ? isFree
              ? 'This event is free. Confirm your details to get your ticket.'
              : 'Pay with M-Pesa or card to get your ticket.'
            : step === 'payment'
            ? booking?.eventTitle
            : 'Your booking is confirmed.'
        }
        maxWidth={step === 'success' ? 'xl' : 'lg'}
      >
        {step === 'payment' && booking ? (
          <PaymentStatusPanel
            booking={booking}
            config={config}
            onRetry={handleRetry}
            isRetrying={isRetrying}
            retryError={retryError}
            lastChoice={paymentChoice}
            phoneError={phoneError}
          />
        ) : step === 'payment' ? (
          <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
            {retryError || 'Loading your booking…'}
          </div>
        ) : step === 'form' && event && tier ? (
          <form onSubmit={handleConfirmOrder} className="space-y-6">
            {/* Summary Box */}
            <div className="bg-[#E9E2D6] rounded-2xl p-5 border border-[#D8CDBC] space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#8A4F33]">
                    {event.category}
                  </span>
                  <h4 className="font-serif text-lg font-medium text-[#1E1814]">
                    {event.title}
                  </h4>
                </div>
              </div>

              <div className="text-xs text-[#675A50] space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#8A4F33]" />
                  <span>{event.date} · {event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8A4F33]" />
                  <span>{[event.venue.name, event.venue.city].filter(Boolean).join(', ')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#D8CDBC] flex justify-between items-center text-xs">
                <span className="text-[#1E1814] font-medium">
                  {tier.name} × {quantity}
                  <span className="block text-[11px] font-normal text-[#675A50]">
                    {admitsLabel(quantity * (tier.admits || 1))}
                    {tierPrice.onSale ? ` · flash-sale price ${formatKES(tierPrice.price)} each` : ''}
                  </span>
                </span>
                <span className="font-serif font-bold text-[#1E1814] text-base tabular-nums">
                  {formatKES(baseTotal)}
                </span>
              </div>

              {!isFree && discount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-700 font-medium">
                  <span>Promo discount ({appliedPromo?.percentOff}%)</span>
                  <span>−{formatKES(discount, null)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#D8CDBC] flex justify-between items-baseline">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#1E1814] block">
                  Total
                </span>
                <span className="font-serif text-2xl font-bold text-[#8A4F33] tabular-nums">
                  {formatKES(finalTotal)}
                </span>
              </div>
            </div>

            {/* Attendee Info Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Name of the person attending"
                  className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Where we should send your ticket details"
                  className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
                {!user && (
                  <p className="text-[11px] text-[#675A50] mt-1.5">
                    No account needed. Sign in before booking if you want this ticket kept in your profile.
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  Notes for the Organizer (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Accessibility needs or anything the organizer should know"
                  className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>

              {/* Promo Code Input (paid events only) */}
              {!isFree && (
                <div className="pt-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        // A changed code has to be applied again
                        setAppliedPromo(null);
                        setDiscount(0);
                      }}
                      aria-label="Promo code"
                      placeholder="Promo code (optional)"
                      className="flex-1 px-4 py-2 bg-ivory border border-[#D8CDBC] rounded-xl text-xs text-[#1E1814] uppercase placeholder:normal-case focus:outline-none focus:border-[#8A4F33]"
                    />
                    <Button variant="secondary" size="sm" type="button" onClick={applyPromo} disabled={isCheckingPromo}>
                      {isCheckingPromo ? 'Checking…' : 'Apply'}
                    </Button>
                  </div>
                  {promoError && (
                    <span className="text-[11px] text-red-600 mt-1 block">{promoError}</span>
                  )}
                  {appliedPromo && (
                    <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                      ✓ Promo code {appliedPromo.code} applied: {appliedPromo.percentOff}% off.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Payment (paid events only) */}
            {!isFree && (
              <MpesaPaymentSection
                totalKes={finalTotal}
                value={paymentChoice}
                onChange={(next) => {
                  setPaymentChoice(next);
                  setPhoneError(null);
                  setSubmitError(null);
                }}
                config={config}
                phoneError={phoneError}
                disabled={isSubmitting}
              />
            )}

            <div className="pt-2">
              {submitError && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{submitError}</div>
              )}
              <Button variant="primary" fullWidth size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isFree
                    ? 'Registering…'
                    : 'Starting payment…'
                  : isFree || finalTotal === 0
                  ? 'Register for free'
                  : paymentChoice.method === 'mpesa'
                  ? `Pay ${formatKES(finalTotal, null)} with M-Pesa`
                  : `Pay ${formatKES(finalTotal, null)} by card`}
              </Button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#675A50]">
                <Info className="w-4 h-4 text-[#8A4F33]" />
                <span>Questions about this event? Email magiventskenya@gmail.com</span>
              </div>
            </div>
          </form>
        ) : (
          /* Digital Pass View */
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-2xl font-medium text-[#1E1814]">
                Booking Confirmed
              </h4>
              <p className="text-sm text-[#675A50]">
                {user ? (
                  <>
                    Your ticket for <strong className="text-[#1E1814]">{confirmedBooking?.attendeeName}</strong> is saved
                    under <strong className="text-[#1E1814]">My Profile &amp; Passes</strong>.
                  </>
                ) : (
                  <>
                    We emailed your ticket to <strong className="text-[#1E1814]">{confirmedBooking?.attendeeEmail}</strong>.
                    Keep the code <strong className="text-[#1E1814] font-mono">{confirmedBooking?.ticketCode}</strong>: with it
                    and your email you can open the ticket again under <strong className="text-[#1E1814]">Find my ticket</strong>.
                  </>
                )}
              </p>

              {confirmedBooking?.paymentMethod === 'mpesa' && confirmedBooking.mpesaReceiptNumber && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#00A34D]/10 border border-[#00A34D]/30 rounded-full text-xs text-[#00A34D] font-medium">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    Paid via M-Pesa (Receipt: <strong className="font-mono">{confirmedBooking.mpesaReceiptNumber}</strong>)
                  </span>
                </div>
              )}
              {bookingIsFree && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#00A34D]/10 border border-[#00A34D]/30 rounded-full text-xs text-[#00A34D] font-medium">
                  <Ticket className="w-3.5 h-3.5" />
                  <span>Free entry</span>
                </div>
              )}
            </div>

            {/* Ticket Card */}
            <div className="bg-[#EFE8DD] border-2 border-[#D8CDBC] rounded-3xl p-6 sm:p-8 shadow-sand-md relative overflow-hidden">
              {/* Cutout notches */}
              <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-ivory border-r-2 border-[#D8CDBC] -translate-y-1/2" />
              <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-ivory border-l-2 border-[#D8CDBC] -translate-y-1/2" />

              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-dashed border-[#D8CDBC]">
                <div>
                  <span className="font-serif text-xl font-bold tracking-tight text-[#1E1814]">
                    MagiVents Ticket
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-[#675A50] block">
                    Admission ticket
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#8A4F33] bg-[#8A4F33]/10 px-2.5 py-1 rounded-full">
                    {confirmedBooking?.ticketCode}
                  </span>
                </div>
              </div>

              <div className="py-5 space-y-3">
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#1E1814]">
                  {confirmedBooking?.eventTitle}
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs text-[#675A50]">
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#1E1814] block">
                      Attendee
                    </span>
                    <span>{confirmedBooking?.attendeeName}</span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#1E1814] block">
                      Ticket
                    </span>
                    <span>
                      {confirmedBooking?.tierName} × {confirmedBooking?.quantity}
                      <span className="block">{admitsLabel(confirmedBooking?.admits ?? confirmedBooking?.quantity ?? 1)}</span>
                    </span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#1E1814] block">
                      Date & Time
                    </span>
                    <span>{confirmedBooking?.eventDate} · {confirmedBooking?.eventTime}</span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#1E1814] block">
                      Venue
                    </span>
                    <span className="truncate">{confirmedBooking?.venueName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-[#D8CDBC] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TicketQRCode value={confirmedBooking?.ticketUrl} size={96} />
                  <div className="text-[11px] text-[#675A50]">
                    <span>Show this QR code at the entrance</span>
                    <span className="block font-medium text-[#1E1814]">
                      Issued {confirmedBooking?.bookingDate}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-lg font-bold text-[#1E1814] tabular-nums block">
                    {bookingIsFree ? 'Free entry' : `${formatKES(confirmedBooking?.totalPrice ?? 0, null)} paid`}
                  </span>
                  {!bookingIsFree && (
                    <span className="text-[11px] text-[#675A50]">
                      {confirmedBooking?.paymentMethod === 'mpesa' ? 'M-Pesa' : 'Card'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions: Print Pass & Email Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                fullWidth
                icon={<Printer className="w-4 h-4 text-[#8A4F33]" />}
                onClick={() => setIsPrintModalOpen(true)}
              >
                Print Ticket
              </Button>

              <Button
                variant="outline"
                fullWidth
                icon={<Mail className="w-4 h-4 text-[#8A4F33]" />}
                onClick={() => setIsEmailModalOpen(true)}
              >
                Email Confirmation
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              {ticketEvent && (
                <Button
                  variant="secondary"
                  fullWidth
                  icon={calendarAdded ? <Check className="w-4 h-4 text-emerald-600" /> : <CalendarPlus className="w-4 h-4" />}
                  onClick={handleAddToCalendar}
                >
                  {calendarAdded ? 'Calendar file downloaded' : 'Add to Calendar'}
                </Button>
              )}
              {ticketEvent && onShareEvent && (
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Share2 className="w-4 h-4 text-[#8A4F33]" />}
                  onClick={() => onShareEvent(ticketEvent)}
                >
                  Invite Friends
                </Button>
              )}
              <Button
                variant="primary"
                fullWidth
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Ticket Printing Modal */}
      <PrintableTicketModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        booking={confirmedBooking}
      />

      {/* Email Confirmation Modal */}
      <EmailConfirmationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        booking={confirmedBooking}
      />
    </>
  );
};
