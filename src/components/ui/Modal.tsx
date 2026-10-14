import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  /**
   * A panel shown beside the dialog on wide screens and as a bottom sheet over it on small ones
   * (e.g. the event assistant). The dialog stays usable while it is open.
   */
  aside?: React.ReactNode;
  /** Hides the aside without unmounting it (so its state survives); default true */
  asideOpen?: boolean;
  /** Called on Esc before the dialog closes; return true when it handled Esc (e.g. by closing the aside) */
  onEscape?: () => boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'xl',
  aside,
  asideOpen = true,
  onEscape
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (onEscape?.()) return;
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
  }, [isOpen, onClose, onEscape]);

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

      <div className={`relative w-full flex items-start justify-center gap-4 ${aside && asideOpen ? 'lg:max-w-[calc(42rem+25rem)]' : ''}`}>
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
        <div className={`p-6 sm:p-8 max-h-[80vh] overflow-y-auto ${aside && asideOpen ? 'pb-[45vh] lg:pb-8' : ''}`}>{children}</div>
      </div>

      {aside && (
        <div className={`${asideOpen ? 'flex' : 'hidden'} fixed inset-x-0 bottom-0 z-[60] max-h-[70vh] flex-col lg:relative lg:inset-auto lg:z-10 lg:w-96 lg:shrink-0 lg:my-8 lg:h-[calc(80vh+5.5rem)] lg:max-h-none`}>
          {aside}
        </div>
      )}
      </div>
    </div>
  );
};
