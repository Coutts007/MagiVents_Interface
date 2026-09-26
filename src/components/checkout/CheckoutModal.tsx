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
  Check
} from 'lucide-react';
import { EventItem, TicketTier, TicketBooking } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
  tier: TicketTier | null;
  quantity: number;
  onCompleteBooking: (booking: TicketBooking) => void;
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

  useEffect(() => {
    if (user && isOpen) {
      if (!fullName) setFullName(user.name);
      if (!email) setEmail(user.email);
    }
  }, [user, isOpen]);

  if (!event || !tier) return null;

  const baseTotal = tier.price * quantity;
  const finalTotal = Math.max(0, baseTotal - discount);

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

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;

    const booking: TicketBooking = {
      id: `booking-${Date.now()}`,
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      eventTime: event.time,
      venueName: event.venue.name,
      tierName: tier.name,
      quantity,
      unitPrice: tier.price,
      totalPrice: finalTotal,
      attendeeName: fullName,
      attendeeEmail: email,
      bookingDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      ticketCode: `MV-${Math.floor(100000 + Math.random() * 900000)}`
    };

    setConfirmedBooking(booking);
    onCompleteBooking(booking);
    setStep('success');
  };

  const handleClose = () => {
    setStep('form');
    setFullName('');
    setEmail('');
    setNotes('');
    setConfirmedBooking(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'form' ? 'Reserve Your Experience' : 'Your Digital Admission Pass'}
      subtitle={
        step === 'form'
          ? 'Secure your place at this limited-capacity gathering.'
          : 'Confirmation and receipt delivered to your inbox.'
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
              <span className="text-xs uppercase tracking-wider font-semibold text-[#2A2421]">
                Total Due
              </span>
              <span className="font-serif text-2xl font-bold text-[#C85A40] tabular-nums">
                ${finalTotal}
              </span>
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
                Email Address (For Digital Pass) *
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

          <div className="pt-2">
            <Button variant="primary" fullWidth size="lg" type="submit">
              Complete Reservation (${finalTotal})
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
              A confirmation packet and calendar invitation have been sent to{' '}
              <strong className="text-[#2A2421]">{confirmedBooking?.attendeeEmail}</strong>.
            </p>
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
              <span className="font-serif text-lg font-bold text-[#2A2421] tabular-nums">
                ${confirmedBooking?.totalPrice} Paid
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
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
  );
};
