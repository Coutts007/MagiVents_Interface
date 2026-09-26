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
  Building
} from 'lucide-react';
import { TicketBooking } from '../../types';
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

  const handleDownloadTextVoucher = () => {
    const content = `================================================
MAGIVENTS CURATED EDITIONS
OFFICIAL DIGITAL ADMISSION PASS
================================================
Pass Code:      ${booking.ticketCode}
Status:         CONFIRMED & ISSUED

GATHERING:      ${booking.eventTitle}
DATE & TIME:    ${booking.eventDate} · ${booking.eventTime}
VENUE:          ${booking.venueName}
GUEST NAME:     ${booking.attendeeName}
EMAIL:          ${booking.attendeeEmail}
TIER:           ${booking.tierName}
NUMBER OF PASSES: ${booking.quantity} Guest(s)

PAYMENT RECEIPT:
Method:         ${booking.paymentMethod === 'mpesa' ? 'Safaricom M-Pesa' : 'Card / Complimentary'}
${booking.paymentMethod === 'mpesa' ? `M-Pesa Receipt: ${booking.mpesaReceiptNumber || 'Verified'}\nM-Pesa Phone:   ${booking.mpesaPhoneNumber || 'N/A'}\nAmount Paid:    KES ${(booking.totalInKes || booking.totalPrice * 130).toLocaleString()} ($${booking.totalPrice})` : `Amount Paid:    $${booking.totalPrice}`}
Booking Date:   ${booking.bookingDate}

ENTRY INSTRUCTIONS:
1. Present this digital pass or physical paper printout at the reception desk.
2. Reception doors open 30 minutes before the scheduled start time.
3. Seating and curatorial access will be prioritized by admission tier.
================================================
MagiVents · Warm Sand & Earth Minimalist Editions
https://magivents.com
`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MagiVents-Pass-${booking.ticketCode}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Admission Pass"
      subtitle="Generate high-resolution paper pass or save as PDF."
      maxWidth="xl"
    >
      <div className="space-y-6">
        {/* Printable Ticket Container with class "printable-ticket-wrapper" */}
        <div
          id="printable-ticket-section"
          className="bg-white border-2 border-[#2A2421] rounded-3xl p-6 sm:p-8 text-[#2A2421] relative overflow-hidden shadow-sand-md print:border-black print:p-6 print:m-0"
        >
          {/* Subtle decorative watermark header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-dashed border-[#E2DDD5]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#2A2421]">
                  MagiVents
                </span>
                <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold px-2 py-0.5 rounded-md bg-[#C85A40]/10">
                  Admission Voucher
                </span>
              </div>
              <p className="text-xs text-[#736B66]">
                Curated Cultural Gatherings & Salon Series
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#736B66] block">
                Verification Pass Code
              </span>
              <span className="font-mono text-base font-bold text-[#C85A40] tracking-wider">
                {booking.ticketCode}
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold block flex items-center gap-1 sm:justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Valid & Confirmed
              </span>
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="py-6 space-y-4">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-[#736B66] font-semibold block">
                Edition Title
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421] mt-0.5">
                {booking.eventTitle}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                  Date & Hour
                </span>
                <div className="text-sm font-medium text-[#2A2421] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#C85A40]" />
                  <span>{booking.eventDate}</span>
                </div>
                <div className="text-xs text-[#736B66] flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-[#C85A40]" />
                  <span>{booking.eventTime}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                  Venue & Location
                </span>
                <div className="text-sm font-medium text-[#2A2421] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#C85A40]" />
                  <span className="truncate">{booking.venueName}</span>
                </div>
                <span className="text-xs text-[#736B66] block">
                  Entrance desk check-in
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E2DDD5]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                  Reserved For
                </span>
                <span className="text-sm font-bold text-[#2A2421] block">
                  {booking.attendeeName}
                </span>
                <span className="text-xs text-[#736B66]">{booking.attendeeEmail}</span>
              </div>

              <div>
                <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
                  Admission Tier
                </span>
                <span className="text-sm font-bold text-[#2A2421] block">
                  {booking.tierName}
                </span>
                <span className="text-xs text-[#736B66]">
                  Admit {booking.quantity} Guest{booking.quantity > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* M-Pesa / Payment Receipt Line */}
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2DDD5] text-xs">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  {booking.paymentMethod === 'mpesa' ? (
                    <Smartphone className="w-4 h-4 text-[#00A34D]" />
                  ) : (
                    <ShieldCheck className="w-4 h-4 text-[#C85A40]" />
                  )}
                  <span className="font-semibold text-[#2A2421]">
                    {booking.paymentMethod === 'mpesa'
                      ? 'Paid via Safaricom M-Pesa'
                      : 'Payment Confirmed'}
                  </span>
                  {booking.mpesaReceiptNumber && (
                    <span className="font-mono text-[11px] bg-[#00A34D]/10 text-[#00A34D] px-2 py-0.5 rounded-md font-bold">
                      Ref: {booking.mpesaReceiptNumber}
                    </span>
                  )}
                </div>
                <div className="font-serif font-bold text-[#2A2421] text-sm">
                  {booking.paymentMethod === 'mpesa' ? (
                    <span>
                      KES {(booking.totalInKes || booking.totalPrice * 130).toLocaleString()} (${booking.totalPrice})
                    </span>
                  ) : (
                    <span>${booking.totalPrice} USD</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Footer with QR Code & Barcode */}
          <div className="pt-5 border-t-2 border-dashed border-[#E2DDD5] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white border border-[#2A2421] rounded-xl p-1 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-[#2A2421]" />
              </div>
              <div className="text-[11px] text-[#736B66]">
                <span className="block font-semibold text-[#2A2421]">
                  Official Security Barcode
                </span>
                <span>Scan at venue doors for instant verification.</span>
                <span className="block font-mono text-[10px] mt-0.5">
                  ISSUED: {booking.bookingDate}
                </span>
              </div>
            </div>

            {/* Stylized Barcode SVG */}
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
              <span className="font-mono text-[10px] text-[#736B66] block">
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
              Export Pass File
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
              Print Ticket Voucher
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
