import React, { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { getApiErrorMessage } from '../../services/api';

const fieldClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';

export interface ReasonDialogProps {
  isOpen: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  /** An extra required text field, e.g. the payment reference */
  extraField?: { label: string; placeholder?: string };
  /** An optional checkbox, e.g. "also take down published events" */
  checkbox?: { label: string; defaultChecked?: boolean };
  onClose: () => void;
  onConfirm: (reason: string, extra: string, checked: boolean) => Promise<void>;
}

/** Admin actions that change money or access always ask why; the reason is recorded with who and when. */
export const ReasonDialog: React.FC<ReasonDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  danger,
  extraField,
  checkbox,
  onClose,
  onConfirm
}) => {
  const [reason, setReason] = useState('');
  const [extra, setExtra] = useState('');
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setExtra('');
    setChecked(Boolean(checkbox?.defaultChecked));
    setError(null);
  }, [isOpen, checkbox?.defaultChecked]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return setError('Give a reason; it is kept with this change.');
    if (extraField && !extra.trim()) return setError(`Enter the ${extraField.label.toLowerCase()}.`);
    setIsBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim(), extra.trim(), checked);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <form onSubmit={submit} noValidate className="space-y-4">
        <div className="text-sm text-[#675A50] leading-relaxed">{description}</div>
        {extraField && (
          <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
            {extraField.label}
            <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder={extraField.placeholder}
              className={`${fieldClass} mt-1 normal-case tracking-normal font-normal`} />
          </label>
        )}
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Reason
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus
            className={`${fieldClass} mt-1 normal-case tracking-normal font-normal`} />
        </label>
        {checkbox && (
          <label className="flex items-start gap-2 text-sm text-[#1E1814] cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)}
              className="mt-1 w-4 h-4 accent-[#8A4F33]" />
            {checkbox.label}
          </label>
        )}
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant={danger ? 'danger' : 'primary'} disabled={isBusy}>
            {isBusy ? 'Saving…' : confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
