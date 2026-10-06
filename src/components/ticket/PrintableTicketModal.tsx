import React from 'react';
import {
  Printer,
  X,
  QrCode,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Download,
  Smartphone,
  ShieldCheck,
  Ticket
} from 'lucide-react';
import { TicketBooking } from '../../types';
import { buildTicketText, getPaymentSummary, MAGIVENTS_CONTACT_EMAIL } from '../../utils/ticketPrinting';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface PrintableTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: TicketBooking | null;
}

export const PrintableTicketModal: React.FC<PrintableTicketModalProps> = ({
  isOpen,
  onClose,
  booking
}) => {
  if (!booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const payment = getPaymentSummary(booking);

  const handleDownloadTextVoucher = () => {
    const content = buildTicketText(booking);

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MagiVents-Ticket-${booking.ticketCode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Ticket"
      subtitle="Print your ticket or save it as a PDF."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Printable Ticket Container with class "printable-ticket-wrapper" */}
        <div
          id="printable-ticket-section"
          className="bg-ivory border-2 border-[#1E1814] rounded-3xl p-6 sm:p-8 text-[#1E1814] relative overflow-hidden shadow-sand-md print:border-black print:p-6 print:m-0"
        >
          {/* Subtle decorative watermark header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-dashed border-[#D8CDBC]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {/* Baked-in black tile so the logo still prints when browsers drop backgrounds */}
                <img
                  src="/brand/magivents-logo-tile.png"
                  alt="MagiVents"
                  width={365}
                  height={93}
                  className="h-9 w-auto rounded-lg"
                />
                <span className="text-xs uppercase tracking-widest text-[#1E1814] font-bold px-2 py-0.5 rounded-md bg-brand-gold">
                  Ticket
                </span>
              </div>
              <p className="text-xs text-[#675A50]">
                Kenya's events platform
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#675A50] block">
                Ticket Code
              </span>
              <span className="font-mono text-base font-bold text-[#8A4F33] tracking-wider">
                {booking.ticketCode}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1 sm:justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirmed
              </span>
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="py-6 space-y-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#675A50] font-semibold block">
                Event
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1814] mt-0.5">
                {booking.eventTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                  Date & Time
                </span>
                <div className="text-sm font-medium text-[#1E1814] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#8A4F33]" />
                  <span>{booking.eventDate}</span>
                </div>
                <div className="text-xs text-[#675A50] flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#8A4F33]" />
                  <span>{booking.eventTime}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                  Venue
                </span>
                <div className="text-sm font-medium text-[#1E1814] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#8A4F33]" />
                  <span className="truncate">{booking.venueName}</span>
                </div>
                <span className="text-xs text-[#675A50] block">
                  Check in at the entrance
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#D8CDBC]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                  Attendee
                </span>
                <span className="text-sm font-bold text-[#1E1814] block">
                  {booking.attendeeName}
                </span>
                <span className="text-xs text-[#675A50]">{booking.attendeeEmail}</span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
                  Ticket Type
                </span>
                <span className="text-sm font-bold text-[#1E1814] block">
                  {booking.tierName}
                </span>
                <span className="text-xs text-[#675A50]">
                  Admits {booking.quantity} {booking.quantity === 1 ? 'person' : 'people'}
                </span>
              </div>
            </div>

            {/* M-Pesa / Payment Receipt Line */}
            <div className="p-3 bg-[#EFE8DD] rounded-xl border border-[#D8CDBC] text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  {payment.isFree ? (
                    <Ticket className="w-4 h-4 text-[#00A34D]" />
                  ) : booking.paymentMethod === 'mpesa' ? (
                    <Smartphone className="w-4 h-4 text-[#00A34D]" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#8A4F33]" />
                  )}
                  <span className="font-semibold text-[#1E1814]">
                    {payment.isFree ? 'Free entry' : `Paid via ${payment.method}`}
                  </span>
                  {payment.reference && (
                    <span className="font-mono text-[11px] bg-[#00A34D]/10 text-[#00A34D] px-2 py-0.5 rounded-md font-bold">
                      Ref: {payment.reference}
                    </span>
                  )}
                </div>
                <div className="font-serif font-bold text-[#1E1814] text-sm">
                  <span>{payment.amount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer with QR Code & Barcode */}
          <div className="pt-5 border-t-2 border-dashed border-[#D8CDBC] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-ivory border border-[#1E1814] rounded-xl p-1 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-[#1E1814]" />
              </div>
              <div className="text-[11px] text-[#675A50]">
                <span className="block font-semibold text-[#1E1814]">
                  Show this ticket at the entrance
                </span>
                <span>Staff will check your ticket code.</span>
                <span className="block font-mono text-[10px] mt-0.5">
                  ISSUED: {booking.bookingDate}
                </span>
                <span className="block text-[10px] mt-0.5">Help: {MAGIVENTS_CONTACT_EMAIL}</span>
              </div>
            </div>

            {/* Decorative barcode */}
            <div className="text-center sm:text-right">
              <div className="h-9 flex items-center justify-end gap-1 opacity-80">
                <span className="w-1 h-8 bg-black block" />
                <span className="w-0.5 h-8 bg-black block" />
                <span className="w-1.5 h-8 bg-black block" />
                <span className="w-0.5 h-8 bg-black block" />
                <span className="w-2 h-8 bg-black block" />
                <span className="w-1 h-8 bg-black block" />
                <span className="w-0.5 h-8 bg-black block" />
                <span className="w-1.5 h-8 bg-black block" />
                <span className="w-1 h-8 bg-black block" />
                <span className="w-2 h-8 bg-black block" />
                <span className="w-0.5 h-8 bg-black block" />
                <span className="w-1 h-8 bg-black block" />
              </div>
              <span className="font-mono text-[10px] text-[#675A50] block">
                {booking.ticketCode}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Print Now, Download Text, Done */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadTextVoucher}
            >
              Download Ticket
            </Button>
          </div>

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
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
            >
              Print Ticket
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
