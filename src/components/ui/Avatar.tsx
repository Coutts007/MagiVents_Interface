import React, { useState } from 'react';
import { getInitials } from '../../utils/format';

export interface AvatarProps {
  name: string;
  /** Uploaded photo; initials are shown when empty or when the image fails to load */
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl'
};

/** Profile photo, or the person's initials until they upload one. */
export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none bg-[#C85A40] text-white font-semibold tracking-wide ${sizeStyles[size]} ${className}`}
      aria-label={name}
      title={name}
    >
      {showImage ? (
        <img
          src={src!}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        getInitials(name)
      )}
    </span>
  );
};
