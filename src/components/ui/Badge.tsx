import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'terracotta' | 'sand' | 'neutral' | 'sage' | 'charcoal';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'terracotta',
  size = 'md',
  className = '',
  icon
}) => {
  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-[10px] tracking-wider font-semibold',
    md: 'px-3 py-1 text-xs font-bold tracking-wider'
  };

  const variantStyles = {
    terracotta: 'bg-[#C85A40]/10 text-[#C85A40] border border-[#C85A40]/25',
    sand: 'bg-[#F4F1EA] text-[#736B66] border border-[#E2DDD5]',
    neutral: 'bg-white/90 backdrop-blur-sm text-[#2A2421] border border-[#E2DDD5] shadow-xs',
    sage: 'bg-[#4A6741]/10 text-[#3A5532] border border-[#4A6741]/25',
    charcoal: 'bg-[#2A2421] text-white border border-[#2A2421]'
  };

  return (
    <span
      className={`rounded-full uppercase inline-flex items-center gap-1.5 whitespace-nowrap transition-colors select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
