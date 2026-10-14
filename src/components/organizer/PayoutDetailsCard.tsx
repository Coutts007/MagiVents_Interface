import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Wallet } from 'lucide-react';
import { getApiErrorMessage, payoutsApi } from '../../services/api';
import {
  PayoutDetails,
  PayoutDetailsInput,
  payoutDetailsError,
  toPayoutInput
} from '../../utils/payoutDetails';
import { Button } from '../ui/Button';
import { PayoutDetailsFields } from './PayoutDetailsFields';

/** The organizer's default payment details, in their profile. */
export const PayoutDetailsCard: React.FC = () => {
  const [saved, setSaved] = useState<PayoutDetails | null>(null);
  const [form, setForm] = useState<PayoutDetailsInput>(toPayoutInput(null));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<{ field: keyof PayoutDetailsInput | null; message: string } | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    payoutsApi
      .getDetails()
      .then((details) => {
        setSaved(details);
        setForm(toPayoutInput(details));
      })
      .catch((err) => setError({ field: null, message: getApiErrorMessage(err, 'Could not load your payment details.') }))
      .finally(() => setIsLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    const problem = payoutDetailsError(form);
    if (problem) {
      setError(problem);
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const details = await payoutsApi.saveDetails(form);
      setSaved(details);
      setForm(toPayoutInput(details));
      setSuccess('Payment details saved.');
    } catch (err) {
      setError({ field: null, message: getApiErrorMessage(err, 'Could not save your payment details.') });
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await payoutsApi.removeDetails();
      setSaved(null);
      setForm(toPayoutInput(null));
      setSuccess('Payment details removed.');
    } catch (err) {
      setError({ field: null, message: getApiErrorMessage(err, 'Could not remove your payment details.') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl bg-ivory rounded-3xl p-6 sm:p-10 border border-[#D8CDBC] shadow-sand-sm space-y-6">
      <div>
        <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold block mb-1">Organizer</span>
        <h3 className="font-serif text-2xl font-medium text-[#1E1814] flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#8A4F33]" aria-hidden="true" />
          Payment details
        </h3>
        <p className="text-xs text-[#675A50] mt-1 leading-relaxed">
          MagiVents collects ticket payments for your events and pays out your sales to the details you give here.
          They are your default; an event can use different details from its event form. Only you and MagiVents
          administrators can see them. Events with paid tickets cannot be published until payment details are set.
        </p>
      </div>

      {saved && (
        <p className="text-xs text-[#1E1814]">
          Current: <strong>{saved.summary}</strong>
        </p>
      )}

      {success && (
        <div role="status" className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div role="alert" className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error.message}</span>
        </div>
      )}

      {isLoading ? (
        <p className="text-xs text-[#675A50]">Loading…</p>
      ) : (
        <form onSubmit={save} noValidate className="space-y-5">
          <PayoutDetailsFields value={form} onChange={setForm} errorField={error?.field} disabled={isSaving} />
          <div className="flex flex-wrap gap-3 justify-end">
            {saved && (
              <Button type="button" variant="ghost" onClick={remove} disabled={isSaving}>
                Remove
              </Button>
            )}
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Saving…' : saved ? 'Update details' : 'Save details'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
