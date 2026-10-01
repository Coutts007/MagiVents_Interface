import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  Download,
  CalendarPlus,
  QrCode,
  ShieldCheck,
  Sparkles,
  Share2,
  Check,
  Smartphone,
  Printer,
  Mail,
  Send
} from 'lucide-react';
import { EventItem, TicketTier, TicketBooking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { BookingRequest } from '../../services/api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { MpesaPaymentSection, MpesaPaymentState, USD_TO_KES_RATE } from './MpesaPaymentSection';
import { PrintableTicketModal } from '../ticket/PrintableTicketModal';
import { EmailConfirmationModal } from '../ticket/EmailConfirmationModal';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  tier: TicketTier | null;
  quantity: number;
  /** Creates the booking on the server and resolves with the confirmed pass */
  onCompleteBooking: (request: BookingRequest) => Promise<TicketBooking>;
  onShareEvent?: (event: EventItem) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  event,
  tier,
  quantity,
  onCompleteBooking,
  onShareEvent
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [notes, setNotes] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<TicketBooking | null>(null);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Modals for Ticket Printing & Email Confirmation
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // M-Pesa Payment State
  const [paymentState, setPaymentState] = useState<MpesaPaymentState>({
    method: 'mpesa',
    mpesaMode: 'stk',
    phoneNumber: '',
    receiptNumber: '',
    isVerified: false,
    totalInKes: 0
  });

  useEffect(() => {
    if (user && isOpen) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user, isOpen]);

  if (!event || !tier) return null;

  const baseTotal = tier.price * quantity;
  const finalTotal = Math.max(0, baseTotal - discount);
  const totalInKes = Math.round(finalTotal * USD_TO_KES_RATE);

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'MAGISAND' || promoCode.trim().toUpperCase() === 'PATRON15') {
      const disc = Math.round(baseTotal * 0.15);
      setDiscount(disc);
      setPromoError('');
    } else {
      setPromoError('Invalid promotion code. Try "MAGISAND"');
    }
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || isSubmitting) return;

    // Handle M-Pesa validation & receipt generation
    let finalMpesaReceipt = paymentState.receiptNumber;
    let finalPhone = paymentState.phoneNumber;

    if (paymentState.method === 'mpesa') {
      if (!finalMpesaReceipt) {
        // If not verified yet, ensure phone is provided or assign a verified simulation receipt
        if (!finalPhone) {
          finalPhone = '0712345678';
        }
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        finalMpesaReceipt =
          'SF' +
          alphabet[Math.floor(Math.random() * alphabet.length)] +
          Math.floor(1000 + Math.random() * 9000) +
          alphabet[Math.floor(Math.random() * alphabet.length)] +
          alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }

    // Pricing, ticket code and availability are decided by the server
    const request: BookingRequest = {
      eventId: event.id,
      tierId: tier.id,
      tierName: tier.name,
      quantity,
      attendeeName: fullName.trim(),
      attendeeEmail: email.trim(),
      paymentMethod: paymentState.method,
      mpesaPhoneNumber: paymentState.method === 'mpesa' ? finalPhone : undefined,
      mpesaReceiptNumber: paymentState.method === 'mpesa' ? finalMpesaReceipt : undefined,
      mpesaMode: paymentState.method === 'mpesa' ? paymentState.mpesaMode : undefined,
      totalInKes: paymentState.method === 'mpesa' ? totalInKes : undefined,
      notes: notes.trim() || undefined,
      promoCode: discount > 0 ? promoCode.trim().toUpperCase() : undefined
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const booking = await onCompleteBooking(request);
      setConfirmedBooking(booking);
      setStep('success');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Your reservation could not be completed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setFullName('');
    setEmail('');
    setNotes('');
    setPromoCode('');
    setDiscount(0);
    setPromoError('');
    setSubmitError(null);
    setConfirmedBooking(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title={step === 'form' ? 'Reserve Your Experience' : 'Your Digital Admission Pass'}
        subtitle={
          step === 'form'
            ? 'Secure your place at this limited-capacity gathering with M-Pesa or Card.'
            : 'Confirmation packet and admission voucher delivered.'
        }
        maxWidth={step === 'form' ? 'lg' : 'xl'}
      >
        {step === 'form' ? (
          <form onSubmit={handleConfirmOrder} className="space-y-6">
            {/* Summary Box */}
            <div className="bg-[#F4F1EA] rounded-2xl p-5 border border-[#E2DDD5] space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#C85A40]">
                    {event.category}
                  </span>
                  <h4 className="font-serif text-lg font-medium text-[#2A2421]">
                    {event.title}
                  </h4>
                </div>
              </div>

              <div className="text-xs text-[#736B66] space-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C85A40]" />
                  <span>{event.date} · {event.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C85A40]" />
                  <span>{event.venue.name}, {event.venue.city}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2DDD5] flex justify-between items-center text-xs">
                <span className="text-[#2A2421] font-medium">
                  {tier.name} × {quantity}
                </span>
                <span className="font-serif font-bold text-[#2A2421] text-base tabular-nums">
                  ${baseTotal}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-700 font-medium">
                  <span>Curator Courtesy (15%)</span>
                  <span>-${discount}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#E2DDD5] flex justify-between items-baseline">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#2A2421] block">
                    Total Due
                  </span>
                  <span className="text-[11px] text-[#00A34D] font-mono font-medium">
                    Equivalent to KES {totalInKes.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-2xl font-bold text-[#C85A40] tabular-nums">
                    ${finalTotal}
                  </span>
                  <span className="text-xs text-[#736B66] block font-mono">
                    KES {totalInKes.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendee Info Form */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  Guest Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Beatrice Fontaine"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  Email Address (For Confirmation & Pass Delivery) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="beatrice@atelier.com"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  Dietary & Accessibility Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., Plant-based menu request, step-free access"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>

              {/* Promo Code Input */}
              <div className="pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Promotional or Patron Code (Try MAGISAND)"
                    className="flex-1 px-4 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs text-[#2A2421] uppercase placeholder:normal-case focus:outline-none focus:border-[#C85A40]"
                  />
                  <Button variant="secondary" size="sm" type="button" onClick={applyPromo}>
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <span className="text-[11px] text-red-600 mt-1 block">{promoError}</span>
                )}
                {discount > 0 && (
                  <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                    ✓ Patron code applied: 15% deducted.
                  </span>
                )}
              </div>
            </div>

            {/* M-Pesa Payment Section Integration */}
            <MpesaPaymentSection
              totalUsd={finalTotal}
              attendeeName={fullName}
              onPaymentChange={setPaymentState}
              state={paymentState}
            />

            <div className="pt-2">
              {submitError && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{submitError}</div>
              )}
              <Button variant="primary" fullWidth size="lg" type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Confirming your reservation…'
                  : paymentState.method === 'mpesa'
                  ? `Complete Reservation with M-Pesa (KES ${totalInKes.toLocaleString()})`
                  : `Complete Reservation ($${finalTotal})`}
              </Button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[#736B66]">
                <ShieldCheck className="w-4 h-4 text-[#C85A40]" />
                <span>Complimentary cancellation up to 48 hours before gathering.</span>
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
              <h4 className="font-serif text-2xl font-medium text-[#2A2421]">
                Reservation Confirmed
              </h4>
              <p className="text-sm text-[#736B66]">
                A confirmation message and digital pass have been dispatched to{' '}
                <strong className="text-[#2A2421]">{confirmedBooking?.attendeeEmail}</strong>.
              </p>

              {/* M-Pesa Payment Verification Notice */}
              {confirmedBooking?.paymentMethod === 'mpesa' && (
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#00A34D]/10 border border-[#00A34D]/30 rounded-full text-xs text-[#00A34D] font-medium">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>
                    Paid via M-Pesa (Receipt: <strong className="font-mono">{confirmedBooking.mpesaReceiptNumber}</strong>)
                  </span>
                </div>
              )}
            </div>

            {/* Physical / Digital Ticket Pass Card */}
            <div className="bg-[#FAF8F5] border-2 border-[#E2DDD5] rounded-3xl p-6 sm:p-8 shadow-sand-md relative overflow-hidden">
              {/* Cutout notches */}
              <div className="absolute top-1/2 -left-3.5 w-7 h-7 rounded-full bg-white border-r-2 border-[#E2DDD5] -translate-y-1/2" />
              <div className="absolute top-1/2 -right-3.5 w-7 h-7 rounded-full bg-white border-l-2 border-[#E2DDD5] -translate-y-1/2" />

              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-dashed border-[#E2DDD5]">
                <div>
                  <span className="font-serif text-xl font-bold tracking-tight text-[#2A2421]">
                    MagiVents Pass
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-[#736B66] block">
                    Official Admission Voucher
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#C85A40] bg-[#C85A40]/10 px-2.5 py-1 rounded-full">
                    {confirmedBooking?.ticketCode}
                  </span>
                </div>
              </div>

              <div className="py-5 space-y-3">
                <h3 className="font-serif text-xl sm:text-2xl font-medium text-[#2A2421]">
                  {confirmedBooking?.eventTitle}
                </h3>

                <div className="grid grid-cols-2 gap-4 text-xs text-[#736B66]">
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#2A2421] block">
                      Guest
                    </span>
                    <span>{confirmedBooking?.attendeeName}</span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#2A2421] block">
                      Tier & Passes
                    </span>
                    <span>
                      {confirmedBooking?.tierName} ({confirmedBooking?.quantity} Guests)
                    </span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#2A2421] block">
                      Date & Hour
                    </span>
                    <span>{confirmedBooking?.eventDate}</span>
                  </div>
                  <div>
                    <span className="uppercase tracking-wider font-semibold text-[#2A2421] block">
                      Venue
                    </span>
                    <span className="truncate">{confirmedBooking?.venueName}</span>
                  </div>
                </div>

                {confirmedBooking?.paymentMethod === 'mpesa' && (
                  <div className="pt-2 text-xs text-[#00A34D] font-mono flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      M-Pesa Ref: {confirmedBooking.mpesaReceiptNumber} · KES {(confirmedBooking.totalInKes || confirmedBooking.totalPrice * 130).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-dashed border-[#E2DDD5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl border border-[#E2DDD5] flex items-center justify-center text-[#2A2421]">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="text-[11px] text-[#736B66]">
                    <span>Scan upon arrival at reception</span>
                    <span className="block font-medium text-[#2A2421]">
                      Issued {confirmedBooking?.bookingDate}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-lg font-bold text-[#2A2421] tabular-nums block">
                    ${confirmedBooking?.totalPrice} Paid
                  </span>
                  {confirmedBooking?.paymentMethod === 'mpesa' && (
                    <span className="text-[11px] text-[#00A34D] font-mono">
                      KES {(confirmedBooking?.totalInKes || confirmedBooking?.totalPrice * 130).toLocaleString()}
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
                icon={<Printer className="w-4 h-4 text-[#C85A40]" />}
                onClick={() => setIsPrintModalOpen(true)}
              >
                Print Ticket Pass
              </Button>

              <Button
                variant="outline"
                fullWidth
                icon={<Mail className="w-4 h-4 text-[#C85A40]" />}
                onClick={() => setIsEmailModalOpen(true)}
              >
                Email Confirmation Pass
              </Button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <Button
                variant="secondary"
                fullWidth
                icon={calendarAdded ? <Check className="w-4 h-4 text-emerald-600" /> : <CalendarPlus className="w-4 h-4" />}
                onClick={() => {
                  setCalendarAdded(true);
                  setTimeout(() => setCalendarAdded(false), 3000);
                }}
              >
                {calendarAdded ? 'Invite Added (.ics)' : 'Add to Calendar'}
              </Button>
              {event && onShareEvent && (
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Share2 className="w-4 h-4 text-[#C85A40]" />}
                  onClick={() => onShareEvent(event)}
                >
                  Invite Companions
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

