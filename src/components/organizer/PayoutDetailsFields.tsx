import React, { useId } from 'react';
import { PAYOUT_METHODS, PayoutDetailsInput } from '../../utils/payoutDetails';

const inputClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33] aria-[invalid=true]:border-red-400';
const labelClass = 'text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1';

export interface PayoutDetailsFieldsProps {
  value: PayoutDetailsInput;
  onChange: (value: PayoutDetailsInput) => void;
  /** The field the last validation complained about */
  errorField?: keyof PayoutDetailsInput | null;
  disabled?: boolean;
}

/** Method picker plus the fields of the chosen method. Used in the profile, the event form and the admin dashboard. */
export const PayoutDetailsFields: React.FC<PayoutDetailsFieldsProps> = ({ value, onChange, errorField, disabled }) => {
  const id = useId();
  const set = (field: keyof PayoutDetailsInput, fieldValue: string) => onChange({ ...value, [field]: fieldValue });

  const field = (name: keyof PayoutDetailsInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`${id}-${name}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`${id}-${name}`}
        value={value[name]}
        onChange={(e) => set(name, e.target.value)}
        aria-invalid={errorField === name}
        disabled={disabled}
        className={inputClass}
        {...props}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="How to be paid" className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PAYOUT_METHODS.map((method) => {
          const selected = value.method === method.id;
          return (
            <button
              key={method.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange({ ...value, method: method.id })}
              className={`p-3 rounded-xl border text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A4F33] ${
                selected ? 'border-[#8A4F33] bg-[#8A4F33]/5' : 'border-[#D8CDBC] bg-ivory hover:border-[#675A50]'
              }`}
            >
              <span className="block text-xs font-semibold text-[#1E1814]">{method.label}</span>
              <span className="block text-[11px] text-[#675A50] mt-0.5">{method.hint}</span>
            </button>
          );
        })}
      </div>

      {value.method === 'mpesa_phone' &&
        field('phoneNumber', 'M-Pesa number', { inputMode: 'tel', autoComplete: 'tel', placeholder: '0712 345 678' })}
      {value.method === 'till' && field('tillNumber', 'Till number', { inputMode: 'numeric', placeholder: 'e.g. 5123456' })}
      {value.method === 'paybill' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('paybillNumber', 'Paybill number', { inputMode: 'numeric', placeholder: 'e.g. 247247' })}
          {field('paybillAccount', 'Account number', { placeholder: 'e.g. 0012345' })}
        </div>
      )}
      {value.method === 'bank' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field('bankName', 'Bank', { placeholder: 'e.g. Equity Bank' })}
          {field('bankAccountName', 'Account name', { placeholder: 'Name on the account' })}
          {field('bankAccountNumber', 'Account number', { inputMode: 'numeric', placeholder: 'Digits only' })}
        </div>
      )}
    </div>
  );
};
