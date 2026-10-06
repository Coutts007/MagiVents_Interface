import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl'
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#1E1814]/60 backdrop-blur-sm transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        className={`relative w-full ${maxWidthStyles[maxWidth]} bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-xl overflow-hidden z-10 transition-all duration-300 animate-in fade-in zoom-in-95 my-8`}
      >
        <div aria-hidden="true" className="h-[3px] bg-brand-gold" />
        {/* Header */}
        {(title || subtitle) && (
          <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-[#D8CDBC] flex items-start justify-between bg-[#E9E2D6]/40">
            <div>
              {title && (
                <h3 className="font-serif text-2xl font-medium text-[#1E1814]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[#675A50] mt-1 font-sans">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 -mr-2 text-[#675A50] hover:text-[#1E1814] hover:bg-[#D8CDBC]/60 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* If no title/subtitle, still provide close button */}
        {!title && !subtitle && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute top-4 right-4 z-20 p-2 text-[#675A50] hover:text-[#1E1814] bg-ivory/80 hover:bg-ivory rounded-full transition-colors shadow-sand-sm cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
