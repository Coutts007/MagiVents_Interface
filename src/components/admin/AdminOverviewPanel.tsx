import React, { useEffect, useState } from 'react';
import { CalendarClock, HandCoins, Users, Wallet } from 'lucide-react';
import { AdminOverview, adminApi, getApiErrorMessage } from '../../services/api';
import { formatKES } from '../../utils/format';
import { cardClass } from '../console/shared';
import type { AdminSection } from './AdminDashboard';

export const AdminOverviewPanel: React.FC<{ onOpen: (section: AdminSection, filter?: string) => void }> = ({ onOpen }) => {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .overview()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load the overview.')));
  }, []);

  if (error) return <p role="alert" className="my-8 text-sm text-red-700">{error}</p>;

  const month = data ? new Date(data.monthStart).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }) : '';
  const cards = [
    {
      label: 'Organizers',
      value: data ? String(data.organizers) : '…',
      note: data ? `${data.suspendedOrganizers} suspended` : '',
      icon: Users,
      open: () => onOpen('organizers')
    },
    {
      label: 'Events awaiting payment',
      value: data ? String(data.eventsAwaitingPayment) : '…',
      note: data ? `${formatKES(data.unpaidFeesTotal, 'KSh 0')} in listing fees due` : '',
      icon: CalendarClock,
      open: () => onOpen('fees', 'unpaid')
    },
    {
      label: 'Fees collected this month',
      value: data ? formatKES(data.feesCollectedThisMonth, 'KSh 0') : '…',
      note: data ? `${month} · ${formatKES(data.feesCollectedAllTime, 'KSh 0')} all time` : '',
      icon: HandCoins,
      open: () => onOpen('fees', 'paid')
    },
    {
      label: 'Organizer balances outstanding',
      value: data ? formatKES(data.balancesOutstanding, 'KSh 0') : '…',
      note: 'Ticket sales not yet paid out',
      icon: Wallet,
      open: () => onOpen('organizers')
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 my-8" aria-busy={!data}>
      {cards.map(({ label, value, note, icon: Icon, open }) => (
        <button
          key={label}
          type="button"
          onClick={open}
          className={`${cardClass} p-6 text-left hover:border-[#8A4F33] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A4F33]`}
        >
          <span className="flex items-center justify-between text-[#675A50] mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            <span className="p-2 rounded-xl bg-[#E9E2D6] text-[#8A4F33]">
              <Icon className="w-4 h-4" aria-hidden="true" />
            </span>
          </span>
          <span className="block font-serif text-3xl font-medium text-[#1E1814] tabular-nums">{value}</span>
          <span className="text-xs text-[#675A50] mt-1 block">{note}</span>
        </button>
      ))}
    </div>
  );
};
