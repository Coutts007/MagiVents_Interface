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
      'bg-[#C85A40] text-white hover:bg-[#A64831] shadow-sand-sm hover:shadow-sand-md focus-visible:ring-2 focus-visible:ring-[#C85A40] focus-visible:ring-offset-2',
    secondary:
      'bg-white text-[#2A2421] border border-[#E2DDD5] hover:border-[#736B66] hover:bg-[#F4F1EA]/80 shadow-sand-sm focus-visible:ring-2 focus-visible:ring-[#2A2421] focus-visible:ring-offset-2',
    outline:
      'bg-transparent text-[#C85A40] border border-[#C85A40] hover:bg-[#C85A40] hover:text-white focus-visible:ring-2 focus-visible:ring-[#C85A40]',
    ghost:
      'bg-transparent text-[#2A2421] hover:bg-[#E2DDD5]/50 focus-visible:ring-2 focus-visible:ring-[#2A2421]',
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
