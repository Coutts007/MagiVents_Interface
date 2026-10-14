import React, { useEffect, useState } from 'react';
import { Banknote, HandCoins, Wallet } from 'lucide-react';
import { OrganizerEarnings, getApiErrorMessage, payoutsApi } from '../../services/api';
import { formatKES } from '../../utils/format';

const card = 'bg-ivory rounded-3xl p-6 border border-[#D8CDBC] shadow-sand-sm';

/** What the organizer has earned per event, what the platform has paid out, and what is still owed. */
export const EarningsPanel: React.FC<{ onOpenPaymentDetails: () => void }> = ({ onOpenPaymentDetails }) => {
  const [data, setData] = useState<OrganizerEarnings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    payoutsApi
      .summary()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load your earnings.')));
  }, []);

  if (error) return <p role="alert" className="my-8 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="my-8 text-sm text-[#675A50]">Loading…</p>;

  return (
    <div className="my-8 space-y-8">
      <p className="text-sm text-[#675A50] max-w-3xl leading-relaxed">
        MagiVents collects the ticket payments for your events and pays out your earnings to the payment details you
        provided
        {data.details ? (
          <>
            : <strong className="text-[#1E1814]">{data.details.summary}</strong>.{' '}
          </>
        ) : (
          '. You have not added payment details yet. '
        )}
        <button type="button" onClick={onOpenPaymentDetails} className="text-[#8A4F33] font-medium hover:underline cursor-pointer">
          {data.details ? 'Change payment details' : 'Add payment details'}
        </button>
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Earned', value: data.earnings, note: 'Confirmed bookings, after discounts', icon: HandCoins },
          { label: 'Paid out to you', value: data.payoutsTotal, note: `${data.payouts.length} payout${data.payouts.length === 1 ? '' : 's'}`, icon: Banknote },
          { label: 'Balance outstanding', value: data.balance, note: 'Still to be paid out', icon: Wallet }
        ].map(({ label, value, note, icon: Icon }) => (
          <div key={label} className={card}>
            <div className="flex items-center justify-between text-[#675A50] mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
              <div className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33]">
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
            <div className="font-serif text-3xl font-medium text-[#1E1814] tabular-nums">{formatKES(value, 'KSh 0')}</div>
            <span className="text-xs text-[#675A50] mt-1 block">{note}</span>
          </div>
        ))}
      </div>

      <section className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden" aria-labelledby="earnings-by-event">
        <h2 id="earnings-by-event" className="px-6 py-4 border-b border-[#D8CDBC] font-serif text-xl text-[#1E1814]">Earnings by event</h2>
        {data.events.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[#675A50]">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[#675A50] bg-[#E9E2D6]/40">
                <tr>
                  <th scope="col" className="text-left px-6 py-3 font-semibold">Event</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Tickets</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">People</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Discounts</th>
                  <th scope="col" className="text-right px-6 py-3 font-semibold">Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBC]">
                {data.events.map((e) => (
                  <tr key={e.eventId}>
                    <td className="px-6 py-3">
                      <span className="font-medium text-[#1E1814]">{e.title}</span>
                      <span className="block text-xs text-[#675A50]">{e.date}</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{e.ticketsSold}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{e.people}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#675A50]">{e.discounts ? `−${formatKES(e.discounts, null)}` : '—'}</td>
                    <td className="px-6 py-3 text-right tabular-nums font-medium">{formatKES(e.earnings, 'KSh 0')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden" aria-labelledby="payouts-received">
        <h2 id="payouts-received" className="px-6 py-4 border-b border-[#D8CDBC] font-serif text-xl text-[#1E1814]">Payouts received</h2>
        {data.payouts.length === 0 ? (
          <p className="px-6 py-8 text-sm text-[#675A50]">No payouts yet. Payouts appear here once MagiVents has sent your money.</p>
        ) : (
          <ul className="divide-y divide-[#D8CDBC]">
            {data.payouts.map((p) => (
              <li key={p.id} className="px-6 py-3 flex flex-wrap items-baseline justify-between gap-2 text-sm">
                <span>
                  <span className="font-medium text-[#1E1814] tabular-nums">{formatKES(p.amount)}</span>
                  <span className="text-xs text-[#675A50]"> · {new Date(p.paidOn).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {p.sentTo ? ` · to ${p.sentTo}` : ''}</span>
                  {p.note && <span className="block text-xs text-[#675A50]">{p.note}</span>}
                </span>
                <span className="text-xs font-mono text-[#675A50]">{p.reference}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
