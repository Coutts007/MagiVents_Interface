import React from 'react';

export interface BrandLogoProps {
  className?: string;
}

/** The MagiVents wordmark, cut out of its black background so it sits on any dark surface */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'h-9' }) => (
  <img
    src="/brand/magivents-logo-transparent.png"
    alt="MagiVents"
    width={329}
    height={65}
    className={`w-auto select-none ${className}`}
    draggable={false}
  />
);
