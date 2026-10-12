import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ConsoleApi, ConsolePayment, getApiErrorMessage } from '../../services/api';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyRow, Pager, StatusPill, cardClass, formatDateTime, inputClass, useConsoleList } from './shared';

export const PROVIDER_LABELS: Record<ConsolePayment['provider'], string> = {
  simulated: 'Simulated',
  mpesa_stk: 'M-Pesa prompt',
  mpesa_paybill: 'M-Pesa Paybill',
  paystack: 'Card (Paystack)'
};

function RefundPill({ payment }: { payment: ConsolePayment }) {
  if (!payment.needsRefund) return null;
  return payment.refundResolvedAt ? (
    <StatusPill status="refund" label="Refund settled" tone="neutral" />
  ) : (
    <StatusPill status="refund" label="Needs refund" tone="critical" />
  );
}

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <dt className="text-[11px] uppercase tracking-wider text-[#675A50]">{label}</dt>
    <dd className="text-sm text-[#1E1814] break-words">{children}</dd>
  </div>
);

const PaymentDetail: React.FC<{ api: ConsoleApi; id: string | null; onClose: () => void; onChanged: () => void }> = ({
  api,
  id,
  onClose,
  onChanged
}) => {
  const [payment, setPayment] = useState<ConsolePayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPayment(null);
    setError(null);
    setNote('');
    if (id) {
      api
        .payment(id)
        .then(setPayment)
        .catch((err) => setError(getApiErrorMessage(err, 'Could not load this payment.')));
    }
  }, [api, id]);

  if (!id) return null;

  const resolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await api.resolveRefund(payment.id, note.trim());
      setPayment({ ...payment, ...updated });
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Payment" subtitle={payment ? payment.reference : undefined} maxWidth="2xl">
      {!payment ? (
        <p role={error ? 'alert' : undefined} className="text-sm text-[#675A50]">
          {error || 'Loading…'}
        </p>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={payment.status} />
            <RefundPill payment={payment} />
            <span className="font-serif text-2xl tabular-nums ml-auto">{formatKES(payment.amount, null)}</span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Provider">{PROVIDER_LABELS[payment.provider]}</Field>
            <Field label="Started">{formatDateTime(payment.createdAt)}</Field>
            <Field label="M-Pesa receipt / provider reference">
              {payment.receiptNumber || '—'} {payment.providerReference ? `· ${payment.providerReference}` : ''}
            </Field>
            <Field label="Completed">{formatDateTime(payment.completedAt)}</Field>
            <Field label="Event">
              {payment.event.title} <span className="text-[#675A50]">({payment.event.organizerEmail})</span>
            </Field>
            <Field label="Booking">
              {payment.booking.ticketCode || 'no ticket'} · {payment.booking.status} · {payment.booking.quantity} ×
              {' '}
              {formatKES(payment.booking.totalPrice / Math.max(1, payment.booking.quantity), null)}
            </Field>
            <Field label="Attendee">
              {payment.booking.attendeeName} · {payment.booking.attendeeEmail}
              {payment.phoneNumber ? ` · ${payment.phoneNumber}` : ''}
            </Field>
            {payment.failureReason && <Field label="Note from the payment flow">{payment.failureReason}</Field>}
          </dl>

          {payment.needsRefund &&
            (payment.refundResolvedAt ? (
              <div className="p-4 rounded-2xl bg-[#EFE8DD] border border-[#D8CDBC] text-sm">
                <p className="font-semibold text-[#1E1814]">Refund settled</p>
                <p className="text-[#675A50]">
                  {formatDateTime(payment.refundResolvedAt)} by {payment.refundResolvedBy}: {payment.refundNote}
                </p>
              </div>
            ) : (
              <form onSubmit={resolve} className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-3">
                <p className="text-sm text-red-900">
                  This money must be returned to the payer. Refund it in the M-Pesa portal or the Paystack dashboard, then record it here.
                </p>
                <textarea
                  rows={2}
                  required
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="How it was settled, e.g. reversed on M-Pesa, ref QX12AB34CD"
                  aria-label="How the refund was settled"
                  className={`${inputClass} w-full`}
                />
                {error && (
                  <p role="alert" className="text-xs text-red-700">
                    {error}
                  </p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" size="sm" disabled={busy || !note.trim()}>
                    {busy ? 'Saving…' : 'Mark refund as settled'}
                  </Button>
                </div>
              </form>
            ))}

          {payment.rawPayloads && payment.rawPayloads.length > 0 && (
            <details className="rounded-2xl border border-[#D8CDBC] bg-[#EFE8DD]">
              <summary className="px-4 py-3 text-sm font-medium text-[#1E1814] cursor-pointer">
                Provider messages ({payment.rawPayloads.length})
              </summary>
              <div className="px-4 pb-4 space-y-3">
                {payment.rawPayloads.map((entry, i) => (
                  <div key={i}>
                    <p className="text-[11px] uppercase tracking-wider text-[#675A50] mb-1">{entry.source}</p>
                    <pre className="text-[11px] bg-ivory border border-[#D8CDBC] rounded-xl p-3 overflow-x-auto">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </Modal>
  );
};

export const ConsolePayments: React.FC<{ api: ConsoleApi; initialRefund?: string }> = ({ api, initialRefund = '' }) => {
  const [refund, setRefund] = useState(initialRefund);
  const [statusFilter, setStatusFilter] = useState('');
  const [provider, setProvider] = useState('');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = useConsoleList(api.payments, { refund, status: statusFilter, provider, search });

  useEffect(() => setRefund(initialRefund), [initialRefund]);

  return (
    <div className={`${cardClass} overflow-hidden my-8`}>
      <div className="p-5 flex flex-col lg:flex-row gap-3 border-b border-[#D8CDBC]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Reference, M-Pesa receipt, ticket code or attendee email"
            aria-label="Search payments"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={refund} onChange={(e) => setRefund(e.target.value)} aria-label="Refund filter" className={`${inputClass} cursor-pointer`}>
            <option value="">All payments</option>
            <option value="open">Needs refund</option>
            <option value="resolved">Refund settled</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter" className={`${inputClass} cursor-pointer`}>
            <option value="">Any status</option>
            <option value="succeeded">Succeeded</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select value={provider} onChange={(e) => setProvider(e.target.value)} aria-label="Provider filter" className={`${inputClass} cursor-pointer`}>
            <option value="">Any provider</option>
            {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!list.data || list.data.results.length === 0 ? (
        <EmptyRow isLoading={list.isLoading} error={list.error} empty="No payments match." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EFE8DD] text-[11px] uppercase tracking-wider text-[#675A50]">
              <tr>
                <th className="text-left font-semibold px-5 py-2.5">When</th>
                <th className="text-left font-semibold px-3 py-2.5">Event / attendee</th>
                <th className="text-left font-semibold px-3 py-2.5">Provider</th>
                <th className="text-left font-semibold px-3 py-2.5">Status</th>
                <th className="text-right font-semibold px-5 py-2.5">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDBC]">
              {list.data.results.map((p) => (
                <tr key={p.id} onClick={() => setOpenId(p.id)} className="hover:bg-[#EFE8DD]/60 cursor-pointer align-top">
                  <td className="px-5 py-3 whitespace-nowrap text-xs text-[#675A50]">{formatDateTime(p.createdAt)}</td>
                  <td className="px-3 py-3 min-w-[14rem]">
                    <button type="button" onClick={() => setOpenId(p.id)} className="text-left cursor-pointer">
                      <span className="block font-medium text-[#1E1814]">{p.event.title}</span>
                      <span className="block text-xs text-[#675A50] break-all">
                        {p.booking.attendeeEmail} · <span className="font-mono">{p.reference}</span>
                      </span>
                    </button>
                  </td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap">{PROVIDER_LABELS[p.provider]}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusPill status={p.status} />
                      <RefundPill payment={p} />
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">{formatKES(p.amount, null)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={list.data} onPage={list.setPage} />
      <PaymentDetail api={api} id={openId} onClose={() => setOpenId(null)} onChanged={list.reload} />
    </div>
  );
};
