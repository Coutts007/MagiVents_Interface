import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { AdminListingFee, adminApi } from '../../services/api';
import { EVENT_CATEGORIES } from '../../data/categories';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { EmptyRow, Pager, StatusPill, cardClass, formatDateTime, inputClass, useConsoleList } from '../console/shared';
import { ReasonDialog } from './ReasonDialog';

const STATUS: Record<string, { label: string; tone: 'good' | 'warning' | 'critical' | 'neutral' }> = {
  unpaid: { label: 'Unpaid', tone: 'critical' },
  pending: { label: 'Pending', tone: 'warning' },
  paid: { label: 'Paid', tone: 'good' },
  waived: { label: 'Waived', tone: 'neutral' },
  exempt: { label: 'No fee', tone: 'neutral' }
};

/** Every event's listing fee, with filters, totals, and the waive / mark-paid actions. */
export const AdminListingFees: React.FC<{ initialStatus?: string; onOpenOrganizer: (id: string) => void }> = ({
  initialStatus = '',
  onOpenOrganizer
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [action, setAction] = useState<{ kind: 'waive' | 'mark-paid'; fee: AdminListingFee } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { data, setPage, error, isLoading, reload } = useConsoleList(
    (params) => adminApi.listingFees(params),
    { status, category, search, dateFrom, dateTo }
  );
  const totals = data && 'totals' in data ? (data as Awaited<ReturnType<typeof adminApi.listingFees>>).totals : null;

  return (
    <div className="space-y-5 my-8">
      <div className="flex flex-wrap gap-3 items-end">
        <label className="relative">
          <span className="sr-only">Search listing fees</span>
          <Search className="w-4 h-4 text-[#675A50] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Event, organizer or reference"
            className={`${inputClass} pl-9 w-64 max-w-full`} />
        </label>
        <label>
          <span className="sr-only">Fee status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
            <option value="">All statuses</option>
            {Object.entries(STATUS).map(([id, { label }]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="">All categories</option>
            {EVENT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-[#675A50]">
          Created from
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClass} block mt-0.5`} />
        </label>
        <label className="text-[11px] text-[#675A50]">
          to
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClass} block mt-0.5`} />
        </label>
      </div>

      {totals && (
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Events', String(totals.count)],
            ['Paid', formatKES(totals.amountPaid, 'KSh 0')],
            ['Waived', formatKES(totals.amountWaived, 'KSh 0')],
            ['Still due', formatKES(totals.amountUnpaid, 'KSh 0')]
          ].map(([label, value]) => (
            <div key={label} className={`${cardClass} p-4`}>
              <dt className="text-[11px] uppercase tracking-wider font-semibold text-[#675A50]">{label}</dt>
              <dd className="font-serif text-xl text-[#1E1814] tabular-nums mt-1">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {notice && <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{notice}</div>}

      <div className={`${cardClass} overflow-hidden`}>
        {!data || data.results.length === 0 ? (
          <EmptyRow isLoading={isLoading} error={error} empty="No listing fees match." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Listing fees</caption>
              <thead className="text-[11px] uppercase tracking-wider text-[#675A50] bg-[#E9E2D6]/40">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 font-semibold">Event</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Amount</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Reference</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Date</th>
                  <th scope="col" className="text-right px-5 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBC]">
                {data.results.map((fee) => {
                  const audit = fee.waivedBy
                    ? `Waived by ${fee.waivedBy}, ${formatDateTime(fee.waivedAt)}: ${fee.waiveReason}`
                    : fee.markedPaidBy
                      ? `Recorded by ${fee.markedPaidBy}, ${formatDateTime(fee.markedPaidAt)}: ${fee.markPaidReason}`
                      : fee.grandfathered
                        ? 'Listed before listing fees: counts as paid'
                        : fee.latestPayment?.status === 'failed' && fee.status === 'unpaid'
                          ? `Last payment failed: ${fee.latestPayment.failureReason || 'not completed'}`
                          : null;
                  const isDue = fee.amountDue > 0;
                  return (
                    <tr key={fee.eventId} className="align-top">
                      <td className="px-5 py-3">
                        <span className="font-medium text-[#1E1814]">{fee.eventTitle}</span>
                        <span className="block text-xs text-[#675A50]">
                          {fee.category} ·{' '}
                          <button type="button" onClick={() => onOpenOrganizer(fee.organizer.id)}
                            className="hover:underline hover:text-[#8A4F33] cursor-pointer">
                            {fee.organizer.name}
                          </button>
                        </span>
                        {audit && <span className="block text-[11px] text-[#675A50] mt-1 max-w-md">{audit}</span>}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={fee.status} label={STATUS[fee.status]?.label} tone={STATUS[fee.status]?.tone} />
                        <span className="block text-[11px] text-[#675A50] mt-1">Event: {fee.eventStatus.replace('_', ' ')}</span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">
                        {isDue ? (
                          <span>{formatKES(fee.amountDue)} <span className="block text-[11px] text-[#675A50]">due</span></span>
                        ) : (
                          formatKES(fee.amountPaid || fee.amountWaived, 'KSh 0')
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">
                        <span className="font-mono">{fee.paymentReference || fee.reference}</span>
                      </td>
                      <td className="px-3 py-3 text-xs text-[#675A50] whitespace-nowrap">{formatDateTime(fee.paidAt || fee.createdAt)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        {isDue && (
                          <span className="inline-flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => setAction({ kind: 'mark-paid', fee })}>Mark paid</Button>
                            <Button size="sm" variant="ghost" onClick={() => setAction({ kind: 'waive', fee })}>Waive</Button>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} onPage={setPage} />
      </div>

      <ReasonDialog
        isOpen={action?.kind === 'waive'}
        title="Waive the listing fee"
        description={action ? <>The {formatKES(action.fee.amountDue)} fee for <strong>{action.fee.eventTitle}</strong> will not be charged. Your name, the time and the reason are recorded.</> : null}
        confirmLabel="Waive fee"
        onClose={() => setAction(null)}
        onConfirm={async (reason) => {
          if (!action) return;
          const fee = await adminApi.waiveFee(action.fee.eventId, reason);
          setNotice(`Fee waived for ${fee.eventTitle}${fee.eventStatus !== 'draft' ? '; the event is now published' : ''}.`);
          reload();
        }}
      />
      <ReasonDialog
        isOpen={action?.kind === 'mark-paid'}
        title="Record a listing-fee payment"
        description={action ? <>Record that the organizer paid {formatKES(action.fee.amountDue)} for <strong>{action.fee.eventTitle}</strong> outside MagiVents, e.g. to the platform Paybill with reference {action.fee.reference}.</> : null}
        confirmLabel="Mark as paid"
        extraField={{ label: 'Payment reference', placeholder: 'e.g. the M-Pesa code' }}
        onClose={() => setAction(null)}
        onConfirm={async (reason, reference) => {
          if (!action) return;
          const fee = await adminApi.markFeePaid(action.fee.eventId, reason, reference);
          setNotice(`Payment recorded for ${fee.eventTitle}${fee.eventStatus !== 'draft' ? '; the event is now published' : ''}.`);
          reload();
        }}
      />
    </div>
  );
};
