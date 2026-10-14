import React, { useEffect, useState } from 'react';
import { PlatformPaymentSettings, adminApi, getApiErrorMessage } from '../../services/api';
import { Button } from '../ui/Button';
import { cardClass, formatDateTime, inputClass } from '../console/shared';

const EMPTY: PlatformPaymentSettings = { method: 'paybill', businessNumber: '', accountNumber: '', accountName: '', instructions: '' };

/** The account organizers pay listing fees to, and the instructions they see. Display details only. */
export const AdminPlatformPayment: React.FC = () => {
  const [form, setForm] = useState<PlatformPaymentSettings>(EMPTY);
  const [saved, setSaved] = useState<PlatformPaymentSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    adminApi
      .platformPayment()
      .then((data) => {
        setSaved(data);
        setForm(data);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load the payment details.')));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{5,7}$/.test(form.businessNumber.trim())) return setError('A Paybill or Till number has 5 to 7 digits.');
    if (!form.accountName.trim()) return setError('Enter the account name organizers will see on the M-Pesa prompt.');
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await adminApi.savePlatformPayment(form);
      setSaved(data);
      setForm(data);
      setNotice('Saved. Organizers see these details when they pay a listing fee.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save.'));
    } finally {
      setIsBusy(false);
    }
  };

  const set = (field: keyof PlatformPaymentSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const field = `${inputClass} w-full mt-1 normal-case tracking-normal font-normal`;
  const label = 'block text-xs font-semibold text-[#1E1814] uppercase tracking-wider';

  return (
    <form onSubmit={save} noValidate className={`${cardClass} my-8 p-5 sm:p-8 space-y-5 max-w-2xl`}>
      <div>
        <h2 className="font-serif text-lg text-[#1E1814]">Platform payment details</h2>
        <p className="text-xs text-[#675A50] mt-1">
          The M-Pesa account organizers pay listing fees to. These are the details shown to them; payment-provider
          credentials are configured on the server, never here.
          {saved?.updatedAt && ` Last changed ${formatDateTime(saved.updatedAt)}${saved.updatedBy ? ` by ${saved.updatedBy}` : ''}.`}
        </p>
      </div>
      <fieldset>
        <legend className={label}>Type</legend>
        <div className="flex gap-6 mt-2 text-sm">
          {(['paybill', 'till'] as const).map((method) => (
            <label key={method} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="platform-method" checked={form.method === method}
                onChange={() => setForm((f) => ({ ...f, method }))} className="accent-[#8A4F33]" />
              {method === 'paybill' ? 'Paybill' : 'Till (Buy Goods)'}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className={label}>
          {form.method === 'paybill' ? 'Paybill number' : 'Till number'}
          <input inputMode="numeric" value={form.businessNumber} onChange={set('businessNumber')} className={field} />
        </label>
        {form.method === 'paybill' && (
          <label className={label}>
            Account number
            <input value={form.accountNumber} onChange={set('accountNumber')} placeholder="Leave empty to use each event's reference" className={field} />
          </label>
        )}
        <label className={`${label} sm:col-span-2`}>
          Account name
          <input value={form.accountName} onChange={set('accountName')} placeholder="e.g. MagiVents Ltd" className={field} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Instructions for organizers
          <textarea rows={4} value={form.instructions} onChange={set('instructions')}
            placeholder="e.g. Go to M-Pesa, Lipa na M-Pesa, Paybill. Use your event reference as the account number." className={field} />
        </label>
      </div>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      {notice && <p role="status" className="text-xs text-emerald-800">{notice}</p>}
      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={isBusy}>{isBusy ? 'Saving…' : 'Save payment details'}</Button>
      </div>
    </form>
  );
};
