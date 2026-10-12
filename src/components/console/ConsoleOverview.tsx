import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Clock, RefreshCw, Users, Wallet } from 'lucide-react';
import { ConsoleApi, ConsoleOverview as Overview, getApiErrorMessage } from '../../services/api';
import { formatKES } from '../../utils/format';
import { RevenueChart } from './RevenueChart';
import { StatusPill, cardClass } from './shared';

const METHOD_LABELS: Record<string, string> = { mpesa: 'M-Pesa', card: 'Card', free: 'Free', complimentary: 'Complimentary' };

const Stat: React.FC<{ label: string; value: string; detail?: string; icon: React.ElementType }> = ({ label, value, detail, icon: Icon }) => (
  <div className={`${cardClass} p-5`}>
    <div className="flex items-center justify-between text-[#675A50] mb-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      <span className="p-1.5 rounded-lg bg-[#E9E2D6] text-[#8A4F33]">
        <Icon className="w-4 h-4" />
      </span>
    </div>
    <div className="font-serif text-2xl font-medium text-[#1E1814] tabular-nums">{value}</div>
    {detail && <span className="text-xs text-[#675A50] mt-1 block">{detail}</span>}
  </div>
);

export const ConsoleOverview: React.FC<{ api: ConsoleApi; onOpenRefunds: () => void; onOpenOrganizer: (id: string) => void }> = ({
  api,
  onOpenRefunds,
  onOpenOrganizer
}) => {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = () => {
    setIsLoading(true);
    api
      .overview()
      .then((overview) => {
        setData(overview);
        setError(null);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load the overview.')))
      .finally(() => setIsLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  if (!data) {
    return (
      <p role={error ? 'alert' : undefined} className={`my-10 text-sm ${error ? 'text-red-700' : 'text-[#675A50]'}`}>
        {error || 'Loading the overview…'}
      </p>
    );
  }

  const s = data.sales;
  const statuses = data.bookingsByStatus;

  return (
    <div className="space-y-6 my-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {data.paymentsMode === 'simulated' ? (
          <p className="text-xs px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
            Payments are in simulated mode: these sales are demo data, no money moved.
          </p>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={load}
          className="text-xs text-[#675A50] hover:text-[#1E1814] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {data.refundsOpen.count > 0 && (
        <button
          type="button"
          onClick={onOpenRefunds}
          className="w-full text-left p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center gap-3 hover:bg-red-100/60 cursor-pointer"
        >
          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
          <span className="text-sm text-red-900">
            <strong>
              {data.refundsOpen.count} {data.refundsOpen.count === 1 ? 'payment needs' : 'payments need'} a refund
            </strong>{' '}
            ({formatKES(data.refundsOpen.amount, null)}). Open the refund queue →
          </span>
        </button>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue, all time" value={formatKES(s.allTime.revenue, null)} detail={`${s.allTime.tickets} tickets · ${s.allTime.bookings} bookings`} icon={Wallet} />
        <Stat label="Last 30 days" value={formatKES(s.last30Days.revenue, null)} detail={`Today ${formatKES(s.today.revenue, null)} · ${s.today.tickets} tickets`} icon={CalendarDays} />
        <Stat label="Held, awaiting payment" value={String(data.pendingHolds.tickets)} detail={`${data.pendingHolds.bookings} pending bookings · ${data.paymentsFailedLast7Days} failed payments this week`} icon={Clock} />
        <Stat label="Organizers" value={String(data.users.organizers)} detail={`${data.users.total} users · ${data.users.newLast30Days} new in 30 days`} icon={Users} />
      </div>

      <div className={`${cardClass} p-5 sm:p-6`}>
        <RevenueChart days={data.daily} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`${cardClass} p-5`}>
          <h3 className="font-serif text-lg font-medium text-[#1E1814] mb-3">Bookings by status</h3>
          <ul className="space-y-2 text-sm">
            {(['confirmed', 'pending', 'failed', 'expired'] as const).map((key) => (
              <li key={key} className="flex items-center justify-between">
                <StatusPill status={key} />
                <span className="tabular-nums text-[#1E1814]">{statuses[key] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={`${cardClass} p-5`}>
          <h3 className="font-serif text-lg font-medium text-[#1E1814] mb-3">Revenue by payment method</h3>
          {data.byMethod.length === 0 ? (
            <p className="text-sm text-[#675A50]">No confirmed bookings yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {data.byMethod.map((row) => (
                <li key={row.method} className="flex items-center justify-between gap-3">
                  <span className="text-[#1E1814]">{METHOD_LABELS[row.method] || row.method}</span>
                  <span className="tabular-nums text-[#675A50]">
                    {formatKES(row.revenue, null)} · {row.bookings}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-[#675A50] mt-3">
            Events: {data.events.published || 0} published · {data.events.sold_out || 0} sold out · {data.events.draft || 0} drafts
          </p>
        </div>
        <div className={`${cardClass} p-5`}>
          <h3 className="font-serif text-lg font-medium text-[#1E1814] mb-3">Top organizers</h3>
          {data.topOrganizers.length === 0 ? (
            <p className="text-sm text-[#675A50]">No sales yet.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {data.topOrganizers.map((o, i) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onOpenOrganizer(o.id)}
                    className="w-full flex items-center justify-between gap-3 hover:text-[#8A4F33] cursor-pointer"
                  >
                    <span className="truncate text-left">
                      {i + 1}. {o.name}
                    </span>
                    <span className="tabular-nums text-[#675A50]">{formatKES(o.revenue, null)}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};
