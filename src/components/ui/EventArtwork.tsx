import React, { useState } from 'react';
import { CategoryIcon } from './CategoryIcon';

export interface EventArtworkProps {
  imageUrl?: string;
  title: string;
  category: string;
  className?: string;
  /** Classes for the <img> element (e.g. hover zoom) */
  imageClassName?: string;
  /** 'plain' draws the placeholder gradient without the icon, for artwork that has text laid over it */
  placeholder?: 'icon' | 'plain';
}

/** Event image, or a branded placeholder with the category icon when there is no image or it fails to load. */
export const EventArtwork: React.FC<EventArtworkProps> = ({
  imageUrl,
  title,
  category,
  className = '',
  imageClassName = '',
  placeholder = 'icon'
}) => {
  const [failed, setFailed] = useState(false);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={title}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`w-full h-full object-cover ${imageClassName} ${className}`}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={title}
      className={`w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#2A2421] via-[#5A3A2E] to-[#C85A40] text-white/90 ${className}`}
    >
      {placeholder === 'icon' && (
        <>
          <CategoryIcon category={category} className="w-10 h-10" />
          <span className="text-[11px] uppercase tracking-widest font-semibold">{category}</span>
        </>
      )}
    </div>
  );
};
