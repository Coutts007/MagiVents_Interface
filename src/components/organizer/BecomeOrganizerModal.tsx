import React, { useState } from 'react';
import { CalendarPlus, BadgePercent, ScanLine } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface BecomeOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called once the account has the organizer role */
  onBecameOrganizer: () => void;
}

const BENEFITS = [
  { icon: CalendarPlus, text: 'Publish free or paid events with your own ticket types and agenda' },
  { icon: BadgePercent, text: 'Create promo codes and follow your ticket sales' },
  { icon: ScanLine, text: 'Check attendees in at the door' }
];

export const BecomeOrganizerModal: React.FC<BecomeOrganizerModalProps> = ({ isOpen, onClose, onBecameOrganizer }) => {
  const { becomeOrganizer, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await becomeOrganizer();
      onBecameOrganizer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upgrade your account.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Become an organizer"
      subtitle="Organizer accounts can create and manage events on MagiVents."
      maxWidth="md"
    >
      <div className="space-y-5">
        <ul className="space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-3 text-sm text-[#1E1814]">
              <span className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33] shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="pt-1">{text}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[#675A50]">
          You keep your tickets and saved events. You are responsible for the events you publish and for honouring the
          tickets you sell.
        </p>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-[#D8CDBC]">
          <Button variant="ghost" type="button" onClick={onClose}>
            Not now
          </Button>
          <Button variant="primary" type="button" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? 'Upgrading…' : 'Yes, make me an organizer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
