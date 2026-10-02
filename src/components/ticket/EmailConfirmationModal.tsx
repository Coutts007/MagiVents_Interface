import React, { useState } from 'react';
import { Mail, Check, Copy, ExternalLink } from 'lucide-react';
import { TicketBooking } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateBookingEmailContent, getPaymentSummary, MAGIVENTS_CONTACT_EMAIL } from '../../utils/ticketPrinting';

export interface EmailConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TicketBooking | null;
}

export const EmailConfirmationModal: React.FC<EmailConfirmationModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  const [recipientEmail, setRecipientEmail] = useState(booking?.attendeeEmail || '');
  const [copied, setCopied] = useState(false);

  // Sync recipientEmail when booking changes
  React.useEffect(() => {
    if (booking?.attendeeEmail) {
      setRecipientEmail(booking.attendeeEmail);
    }
  }, [booking]);

  if (!booking) return null;

  const { subject, plainText } = generateBookingEmailContent(booking);
  const payment = getPaymentSummary(booking);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (e) {
      console.error('Failed to copy email confirmation text', e);
    }
  };

  // Opens the user's own email app with the confirmation filled in
  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(plainText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Your Ticket"
      subtitle="Send the booking confirmation to yourself or someone else."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Recipient */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block">
            Send to
          </label>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C85A40] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Recipient's email address"
              className="flex-1 px-3.5 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>
          <p className="text-[11px] text-[#736B66]">
            This opens your email app with the confirmation ready to send.
          </p>
        </div>

        {/* Email Preview Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold">
              Preview
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-xs text-[#736B66] hover:text-[#2A2421] flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy text'}</span>
            </button>
          </div>

          <div className="bg-white border border-[#E2DDD5] rounded-2xl p-5 shadow-xs space-y-4 font-sans text-xs">
            <div className="border-b border-[#E2DDD5] pb-3">
              <span className="text-[11px] text-[#736B66] block">Subject:</span>
              <span className="font-serif text-sm font-semibold text-[#2A2421]">
                {subject}
              </span>
            </div>

            <div className="space-y-3 text-[#2A2421]">
              <p>
                Hello <strong>{booking.attendeeName}</strong>,
              </p>
              <p className="text-[#736B66] leading-relaxed">
                Your booking on MagiVents is confirmed for <strong>{booking.eventTitle}</strong>.
              </p>

              {/* Condensed ticket details */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E2DDD5] space-y-2">
                <div className="flex justify-between items-center border-b border-[#E2DDD5] pb-2">
                  <span className="font-mono text-xs font-bold text-[#C85A40]">
                    TICKET: {booking.ticketCode}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">
                    {payment.isFree ? 'Free entry' : 'Paid'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#736B66]">
                  <div>
                    <span className="block text-[#2A2421] font-semibold">Date & Time</span>
                    <span>{booking.eventDate} ({booking.eventTime})</span>
                  </div>
                  <div>
                    <span className="block text-[#2A2421] font-semibold">Venue</span>
                    <span>{booking.venueName}</span>
                  </div>
                  <div>
                    <span className="block text-[#2A2421] font-semibold">Ticket</span>
                    <span>
                      {booking.tierName} ({booking.quantity} {booking.quantity === 1 ? 'person' : 'people'})
                    </span>
                  </div>
                  <div>
                    <span className="block text-[#2A2421] font-semibold">Payment</span>
                    <span>
                      {payment.isFree
                        ? 'Free entry'
                        : `${payment.method}${payment.reference ? ` (${payment.reference})` : ''} · ${payment.amount}`}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#736B66] leading-relaxed">
                Show your ticket code at the entrance, on your phone or printed. Need help? Email{' '}
                <a href={`mailto:${MAGIVENTS_CONTACT_EMAIL}`} className="text-[#C85A40] hover:underline">
                  {MAGIVENTS_CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-2">
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            size="md"
            icon={<ExternalLink className="w-4 h-4" />}
            onClick={handleOpenMailClient}
            disabled={!recipientEmail.trim()}
          >
            Open in Email App
          </Button>
        </div>
      </div>
    </Modal>
  );
};
