import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { ConsoleApi } from '../../services/api';
import { formatKES } from '../../utils/format';
import { EmptyRow, Pager, StatusPill, cardClass, formatDateTime, inputClass, useConsoleList } from './shared';

export const ConsoleBookings: React.FC<{ api: ConsoleApi; eventFilter: string | null; onClearEvent: () => void }> = ({
  api,
  eventFilter,
  onClearEvent
}) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const list = useConsoleList(api.bookings, { status: statusFilter, search, eventId: eventFilter || '' });
  const eventTitle = eventFilter ? list.data?.results[0]?.event.title : null;

  useEffect(() => setSearch(''), [eventFilter]);

  return (
    <div className={`${cardClass} overflow-hidden my-8`}>
      <div className="p-5 flex flex-col sm:flex-row gap-3 border-b border-[#D8CDBC]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ticket code, attendee name or email, event"
            aria-label="Search bookings"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Status filter" className={`${inputClass} cursor-pointer`}>
          <option value="">Any status</option>
          <option value="confirmed">Confirmed</option>
          <option value="pending">Pending payment</option>
          <option value="failed">Failed</option>
          <option value="expired">Expired</option>
        </select>
      </div>
      {eventFilter && (
        <div className="px-5 py-2.5 border-b border-[#D8CDBC] flex items-center gap-2 text-xs text-[#675A50]">
          Showing one event{eventTitle ? `: ${eventTitle}` : ''}
          <button type="button" onClick={onClearEvent} aria-label="Show all events" className="p-1 rounded-full hover:bg-[#E9E2D6] cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!list.data || list.data.results.length === 0 ? (
        <EmptyRow isLoading={list.isLoading} error={list.error} empty="No bookings match." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EFE8DD] text-[11px] uppercase tracking-wider text-[#675A50]">
              <tr>
                <th className="text-left font-semibold px-5 py-2.5">Booked</th>
                <th className="text-left font-semibold px-3 py-2.5">Attendee</th>
                <th className="text-left font-semibold px-3 py-2.5">Event / ticket</th>
                <th className="text-left font-semibold px-3 py-2.5">Status</th>
                <th className="text-right font-semibold px-5 py-2.5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDBC]">
              {list.data.results.map((b) => (
                <tr key={b.id} className="align-top">
                  <td className="px-5 py-3 whitespace-nowrap text-xs text-[#675A50]">{formatDateTime(b.bookingDate)}</td>
                  <td className="px-3 py-3">
                    <span className="block text-[#1E1814]">
                      {b.attendeeName} {b.isGuest && <span className="text-[11px] text-[#675A50]">(guest)</span>}
                    </span>
                    <span className="block text-xs text-[#675A50] break-all">{b.attendeeEmail}</span>
                  </td>
                  <td className="px-3 py-3 min-w-[12rem]">
                    <span className="block text-[#1E1814]">{b.event.title}</span>
                    <span className="block text-xs text-[#675A50]">
                      <span className="font-mono">{b.ticketCode || 'no ticket yet'}</span> · {b.tierName} × {b.quantity}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <StatusPill status={b.status} />
                      {b.checkedInAt && <StatusPill status="checked" label="Checked in" tone="good" />}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums whitespace-nowrap">
                    {formatKES(b.totalPrice)}
                    <span className="block text-[11px] text-[#675A50]">{b.paymentMethod}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={list.data} onPage={list.setPage} />
    </div>
  );
};
