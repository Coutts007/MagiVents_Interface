import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface TicketQRCodeProps {
  /** The ticket link to encode; it carries the booking UUID, not the short ticket code */
  value?: string;
  /** Rendered size in pixels */
  size?: number;
  className?: string;
}

/** A scannable QR code for a ticket, drawn as inline SVG so it stays sharp when printed. */
export const TicketQRCode: React.FC<TicketQRCodeProps> = ({ value, size = 96, className = '' }) => {
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setSvg(null);
      return;
    }
    QRCode.toString(value, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#1E1814', light: '#FFFFFF' } })
      .then((markup) => {
        if (!cancelled) setSvg(markup);
      })
      .catch(() => {
        if (!cancelled) setSvg(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div
      role="img"
      aria-label="Ticket QR code. Staff scan it at the entrance."
      style={{ width: size, height: size }}
      className={`bg-white rounded-xl border border-[#D8CDBC] p-1 shrink-0 [&>svg]:w-full [&>svg]:h-full ${
        svg ? '' : 'animate-shimmer'
      } ${className}`}
      // The markup comes from the qrcode library, built from our own ticket URL
      dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
    />
  );
};
