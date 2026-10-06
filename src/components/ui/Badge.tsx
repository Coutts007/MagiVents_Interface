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
    terracotta: 'bg-brand-gold text-[#1E1814] border border-[#9D7B47]/40',
    sand: 'bg-[#E9E2D6] text-[#675A50] border border-[#D8CDBC]',
    neutral: 'bg-ivory/90 backdrop-blur-sm text-[#1E1814] border border-[#D8CDBC] shadow-xs',
    sage: 'bg-[#4A6741]/10 text-[#3A5532] border border-[#4A6741]/25',
    charcoal: 'bg-[#110D0B] text-[#E3B5A1] border border-[#98613D]/40'
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
