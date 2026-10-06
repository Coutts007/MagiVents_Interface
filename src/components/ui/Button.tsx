import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-300 ease-out active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer whitespace-nowrap select-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 rounded-full gap-1.5 tracking-wide',
    md: 'text-sm px-5 py-2.5 rounded-full gap-2 tracking-normal',
    lg: 'text-base px-6 py-3.5 rounded-full gap-2.5 tracking-normal'
  };

  const variantStyles = {
    primary:
      'btn-brand shadow-sand-sm focus-visible:ring-2 focus-visible:ring-[#C7B173] focus-visible:ring-offset-2',
    secondary:
      'bg-ivory text-[#1E1814] border border-[#D8CDBC] hover:border-[#675A50] hover:bg-[#E9E2D6]/80 shadow-sand-sm focus-visible:ring-2 focus-visible:ring-[#1E1814] focus-visible:ring-offset-2',
    outline:
      'bg-transparent text-[#8A4F33] border border-[#8A4F33] hover:bg-[#8A4F33] hover:text-white focus-visible:ring-2 focus-visible:ring-[#8A4F33]',
    ghost:
      'bg-transparent text-[#1E1814] hover:bg-[#D8CDBC]/50 focus-visible:ring-2 focus-visible:ring-[#1E1814]',
    danger:
      'bg-red-50 text-red-700 border border-red-200 hover:bg-red-600 hover:text-white focus-visible:ring-2 focus-visible:ring-red-600'
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
