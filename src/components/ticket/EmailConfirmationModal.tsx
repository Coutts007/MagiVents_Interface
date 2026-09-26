import React, { useState } from 'react';
import {
  Mail,
  Send,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { TicketBooking } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { generateBookingEmailContent } from '../../utils/ticketPrinting';

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
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [showAdditionalInput, setShowAdditionalInput] = useState(false);

  // Sync recipientEmail when booking changes
  React.useEffect(() => {
    if (booking?.attendeeEmail) {
      setRecipientEmail(booking.attendeeEmail);
      setSendSuccess(false);
    }
  }, [booking]);

  if (!booking) return null;

  const { subject, plainText } = generateBookingEmailContent(booking);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch (e) {
      console.error('Failed to copy email confirmation text', e);
    }
  };

  const handleSendEmail = () => {
    if (!recipientEmail.trim()) return;
    setIsSending(true);

    // Simulate sending dispatch to the recipient's mail provider
    setTimeout(() => {
      setIsSending(false);
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 4000);
    }, 1200);
  };

  const handleOpenMailClient = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(plainText)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Email Confirmation Packet"
      subtitle="Digital voucher and reservation receipt delivery."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Recipient / Dispatch status box */}
        <div className="p-4 bg-[#FAF8F5] border border-[#E2DDD5] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C85A40] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                Delivered To Primary Guest
              </span>
              <span className="font-serif text-sm font-medium text-[#2A2421]">
                {booking.attendeeEmail}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              Confirmation Dispatched
            </span>
          </div>
        </div>

        {/* Send Copy to Additional Email */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider">
              Send or Forward Confirmation Copy
            </label>
            <button
              type="button"
              onClick={() => setShowAdditionalInput(!showAdditionalInput)}
              className="text-xs text-[#C85A40] hover:underline font-medium cursor-pointer"
            >
              {showAdditionalInput ? 'Hide' : 'Send to another address'}
            </button>
          </div>

          {showAdditionalInput && (
            <div className="flex gap-2 animate-in fade-in">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="companion@domain.com"
                className="flex-1 px-3.5 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendEmail}
                disabled={isSending}
                icon={isSending ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              >
                {isSending ? 'Sending...' : 'Send Email'}
              </Button>
            </div>
          )}

          {sendSuccess && (
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 animate-in fade-in">
              <Check className="w-3.5 h-3.5" /> Email confirmation successfully sent to {recipientEmail}.
            </p>
          )}
        </div>

        {/* Email Preview Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold">
              Email Subject & Body Preview
            </span>
            <button
              type="button"
              onClick={handleCopyText}
              className="text-xs text-[#736B66] hover:text-[#2A2421] flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Message Text'}</span>
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
                Dear <strong>{booking.attendeeName}</strong>,
              </p>
              <p className="text-[#736B66] leading-relaxed">
                Thank you for reserving your experience with MagiVents. Your admission voucher has been confirmed for <strong>{booking.eventTitle}</strong>.
              </p>

              {/* Condensed Voucher Detail Card in Email */}
              <div className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#E2DDD5] space-y-2">
                <div className="flex justify-between items-center border-b border-[#E2DDD5] pb-2">
                  <span className="font-mono text-xs font-bold text-[#C85A40]">
                    PASS: {booking.ticketCode}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase">
                    Paid / Confirmed
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
                    <span className="block text-[#2A2421] font-semibold">Pass Tier</span>
                    <span>{booking.tierName} ({booking.quantity} Guest{booking.quantity > 1 ? 's' : ''})</span>
                  </div>
                  <div>
                    <span className="block text-[#2A2421] font-semibold">Payment</span>
                    <span>
                      {booking.paymentMethod === 'mpesa'
                        ? `M-Pesa (${booking.mpesaReceiptNumber || 'Verified'}) · KES ${(booking.totalInKes || booking.totalPrice * 130).toLocaleString()}`
                        : `Card · $${booking.totalPrice}`}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#736B66] leading-relaxed">
                Check-in opens 30 minutes prior to scheduled start. You can present this digital message, download your pass, or scan the official QR code at the entrance.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Button
            variant="outline"
            size="md"
            icon={<ExternalLink className="w-4 h-4" />}
            onClick={handleOpenMailClient}
          >
            Open in Email App
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSendEmail}
              disabled={isSending}
              icon={<Send className="w-4 h-4" />}
            >
              {isSending ? 'Sending...' : 'Resend Confirmation'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
