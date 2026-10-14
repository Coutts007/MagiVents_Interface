import React, { useEffect, useState } from 'react';
import { CategoryFeeRow, adminApi, getApiErrorMessage } from '../../services/api';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { cardClass, formatDateTime, inputClass } from '../console/shared';

/** The listing fee per event category, in whole KES; 0 means no fee. */
export const AdminCategoryFees: React.FC = () => {
  const [rows, setRows] = useState<CategoryFeeRow[] | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const show = (fees: CategoryFeeRow[]) => {
    setRows(fees);
    setDraft(Object.fromEntries(fees.map((f) => [f.category, String(f.amount)])));
  };

  useEffect(() => {
    adminApi.categoryFees().then(show).catch((err) => setError(getApiErrorMessage(err, 'Could not load the fees.')));
  }, []);

  const invalid = Object.entries(draft).filter(([, value]) => !/^\d{1,7}$/.test(value.trim()));
  const changed = rows?.filter((r) => String(r.amount) !== (draft[r.category] ?? '').trim()) ?? [];

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invalid.length) {
      setError('Fees are whole shillings, 0 or more.');
      return;
    }
    setIsBusy(true);
    setError(null);
    setNotice(null);
    try {
      show(await adminApi.saveCategoryFees(changed.map((r) => ({ category: r.category, amount: Number(draft[r.category]) }))));
      setNotice('Listing fees saved. Events already paid for are not affected.');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save the fees.'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className={`${cardClass} my-8 overflow-hidden`}>
      <div className="px-5 py-4 border-b border-[#D8CDBC]">
        <h2 className="font-serif text-lg text-[#1E1814]">Listing fees by category</h2>
        <p className="text-xs text-[#675A50] mt-1">
          Organizers pay this once per event before it can be published. 0 means no fee. A new amount applies to events
          not yet listed; events already paid for keep what they paid.
        </p>
      </div>
      {!rows ? (
        <p className="px-5 py-8 text-sm text-center text-[#675A50]">{error || 'Loading…'}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Listing fee per category</caption>
            <thead className="text-[11px] uppercase tracking-wider text-[#675A50] bg-[#E9E2D6]/40">
              <tr>
                <th scope="col" className="text-left px-5 py-3 font-semibold">Category</th>
                <th scope="col" className="text-left px-3 py-3 font-semibold">Fee (KSh)</th>
                <th scope="col" className="text-right px-3 py-3 font-semibold">Events awaiting payment</th>
                <th scope="col" className="text-left px-5 py-3 font-semibold">Last changed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDBC]">
              {rows.map((row) => (
                <tr key={row.category}>
                  <th scope="row" className="text-left px-5 py-3 font-medium text-[#1E1814]">{row.category}</th>
                  <td className="px-3 py-2">
                    <input type="number" min="0" step="1" inputMode="numeric" aria-label={`Listing fee for ${row.category} in KSh`}
                      value={draft[row.category] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [row.category]: e.target.value }))}
                      className={`${inputClass} w-32 tabular-nums`} />
                    <span className="block text-[11px] text-[#675A50] mt-0.5">
                      {Number(draft[row.category]) > 0 ? formatKES(Number(draft[row.category])) : 'No fee'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{row.eventsAwaitingPayment}</td>
                  <td className="px-5 py-3 text-xs text-[#675A50]">
                    {row.updatedAt ? `${formatDateTime(row.updatedAt)}${row.updatedBy ? ` by ${row.updatedBy}` : ''}` : 'Never'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="px-5 py-4 border-t border-[#D8CDBC] flex flex-wrap items-center justify-end gap-3">
        {notice && <span role="status" className="text-xs text-emerald-800 mr-auto">{notice}</span>}
        {error && rows && <span role="alert" className="text-xs text-red-700 mr-auto">{error}</span>}
        <Button type="submit" variant="primary" disabled={isBusy || !rows || changed.length === 0}>
          {isBusy ? 'Saving…' : changed.length ? `Save ${changed.length} change${changed.length === 1 ? '' : 's'}` : 'No changes'}
        </Button>
      </div>
    </form>
  );
};
