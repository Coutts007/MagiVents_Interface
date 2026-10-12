import React, { useState } from 'react';
import { ArrowLeft, Calendar, CheckCircle2, Download, Mail, MapPin, Printer, Search, Ticket } from 'lucide-react';
import { TicketBooking } from '../../types';
import { getApiErrorMessage, ticketsApi } from '../../services/api';
import { getPaymentSummary } from '../../utils/ticketPrinting';
import { Button } from '../ui/Button';
import { TicketQRCode } from '../ui/TicketQRCode';
import { PrintableTicketModal } from './PrintableTicketModal';
import { EmailConfirmationModal } from './EmailConfirmationModal';

export interface TicketViewProps {
  /** A ticket opened from its QR code or email link, or found with the form */
  booking: TicketBooking | null;
  onBookingFound: (booking: TicketBooking | null) => void;
  /** Shown while a ticket link is being loaded */
  isLoading?: boolean;
  /** Set when a ticket link could not be opened */
  loadError?: string | null;
  onBrowseEvents: () => void;
}

const inputClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';

/** "Find my ticket": guests look up a ticket by code and email; ticket links open here too. */
export const TicketView: React.FC<TicketViewProps> = ({
  booking,
  onBookingFound,
  isLoading = false,
  loadError = null,
  onBrowseEvents
}) => {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isEmailOpen, setIsEmailOpen] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !email.trim()) {
      setError('Enter both your ticket code and the email you booked with.');
      return;
    }
    setIsSearching(true);
    setError(null);
    try {
      onBookingFound(await ticketsApi.lookup(code.trim(), email.trim()));
    } catch (err) {
      setError(getApiErrorMessage(err, 'We could not find a ticket with that code and email.'));
    } finally {
      setIsSearching(false);
    }
  };

  const payment = booking ? getPaymentSummary(booking) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      <div className="pb-8 border-b border-[#D8CDBC]">
        <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold block mb-1">Your ticket</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1814]">
          {booking ? booking.eventTitle : 'Find my ticket'}
        </h1>
        <div aria-hidden="true" className="brand-rule w-24 mt-3 rounded-l-full" />
      </div>

      {isLoading ? (
        <div className="my-8 h-80 rounded-3xl animate-shimmer" aria-label="Loading your ticket" />
      ) : booking && payment ? (
        <div className="my-8 space-y-6">
          <div className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-md overflow-hidden">
            <div className="bg-[#1E1814] px-6 py-4 flex items-center justify-between gap-3 border-b-[3px] border-[#C7B173]">
              <span className="flex items-center gap-2 text-[#F4EFE7] text-sm font-semibold">
                <Ticket className="w-4 h-4 text-[#C7B173]" />
                Admission ticket
              </span>
              <span className="font-mono text-[#C7B173] font-bold tracking-wide">{booking.ticketCode}</span>
            </div>
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-start justify-between">
              <dl className="space-y-3 text-sm min-w-0">
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-[#8A4F33] mt-0.5 shrink-0" />
                  <dd>
                    {booking.eventDate} · {booking.eventTime}
                  </dd>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#8A4F33] mt-0.5 shrink-0" />
                  <dd>{booking.venueName}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#675A50]">Attendee</dt>
                  <dd className="font-medium text-[#1E1814]">{booking.attendeeName}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#675A50]">Ticket</dt>
                  <dd>
                    {booking.tierName} · admits {booking.quantity} {booking.quantity === 1 ? 'person' : 'people'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-[#675A50]">Payment</dt>
                  <dd>{payment.isFree ? 'Free entry' : `${payment.amount} · ${payment.method}`}</dd>
                </div>
                {booking.checkedInAt && (
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Checked in {new Date(booking.checkedInAt).toLocaleString('en-KE')}
                  </div>
                )}
              </dl>
              <div className="flex flex-col items-center gap-2 shrink-0">
                <TicketQRCode value={booking.ticketUrl} size={168} />
                <span className="text-[11px] text-[#675A50]">Scan at the entrance</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={ticketsApi.pdfUrl(booking.id)}
              download={`MagiVents-Ticket-${booking.ticketCode}.pdf`}
              className="btn-brand inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A4F33] focus-visible:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </a>
            <Button variant="secondary" icon={<Printer className="w-4 h-4" />} onClick={() => setIsPrintOpen(true)}>
              Print
            </Button>
            <Button variant="secondary" icon={<Mail className="w-4 h-4" />} onClick={() => setIsEmailOpen(true)}>
              Email
            </Button>
            <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => onBookingFound(null)}>
              Find another ticket
            </Button>
          </div>

          <PrintableTicketModal isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} booking={booking} />
          <EmailConfirmationModal isOpen={isEmailOpen} onClose={() => setIsEmailOpen(false)} booking={booking} />
        </div>
      ) : (
        <div className="my-8 space-y-6">
          {loadError && (
            <div role="alert" className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-800">
              {loadError}
            </div>
          )}
          <form
            onSubmit={handleLookup}
            noValidate
            className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm p-6 sm:p-8 space-y-5"
          >
            <p className="text-sm text-[#675A50] leading-relaxed">
              Booked without an account? Enter the ticket code from your confirmation (for example{' '}
              <span className="font-mono text-[#1E1814]">MV-482913</span>) and the email you booked with.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="lookup-code" className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  Ticket code
                </label>
                <input
                  id="lookup-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="MV-123456"
                  autoComplete="off"
                  className={`${inputClass} font-mono uppercase placeholder:normal-case`}
                />
              </div>
              <div>
                <label htmlFor="lookup-email" className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  Email
                </label>
                <input
                  id="lookup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>
            </div>
            {error && (
              <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                {error}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={onBrowseEvents}
                className="text-xs text-[#675A50] hover:text-[#1E1814] underline cursor-pointer"
              >
                Browse events instead
              </button>
              <Button type="submit" variant="primary" icon={<Search className="w-4 h-4" />} disabled={isSearching}>
                {isSearching ? 'Searching…' : 'Find my ticket'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
