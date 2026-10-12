import React, { useEffect, useMemo, useState } from 'react';
import { Activity, CreditCard, LayoutDashboard, ShieldCheck, Ticket, Users } from 'lucide-react';
import { consoleApi } from '../../services/api';
import { ConsoleOverview } from './ConsoleOverview';
import { ConsoleOrganizers } from './ConsoleOrganizers';
import { ConsolePayments } from './ConsolePayments';
import { ConsoleBookings } from './ConsoleBookings';
import { ConsoleActivity } from './ConsoleActivity';

type Section = 'overview' | 'organizers' | 'payments' | 'bookings' | 'activity';

const SECTIONS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'organizers', label: 'Organizers', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
  { id: 'activity', label: 'Activity', icon: Activity }
];

export interface AdminConsoleProps {
  /** The secret path segment this console was opened at */
  secret: string;
  staffName: string;
}

/** Platform staff console: sales, organizers, payments and refunds, bookings, and an audit log. */
export const AdminConsole: React.FC<AdminConsoleProps> = ({ secret, staffName }) => {
  const api = useMemo(() => consoleApi(secret), [secret]);
  const [section, setSection] = useState<Section>('overview');
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<string | null>(null);
  const [refundFilter, setRefundFilter] = useState('');

  // Keep the console out of search engines and browser history titles
  useEffect(() => {
    const previousTitle = document.title;
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex, nofollow';
    document.head.appendChild(robots);
    document.title = 'MagiVents · Staff';
    return () => {
      document.title = previousTitle;
      robots.remove();
    };
  }, []);

  const go = (next: Section) => {
    setSection(next);
    if (next !== 'payments') setRefundFilter('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#D8CDBC]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Staff only
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1814]">MagiVents console</h1>
          <p className="text-sm text-[#675A50] mt-1">Signed in as {staffName}. Changes you make here are recorded.</p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Console sections"
        className="mt-6 bg-[#EFE8DD] p-1 rounded-2xl border border-[#D8CDBC] inline-flex items-center gap-1 overflow-x-auto max-w-full"
      >
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => go(id)}
            className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              section === id ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold' : 'text-[#675A50] hover:text-[#1E1814]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 text-[#8A4F33]" />
            {label}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <ConsoleOverview
          api={api}
          onOpenRefunds={() => {
            setRefundFilter('open');
            go('payments');
          }}
          onOpenOrganizer={(id) => {
            setOrganizerId(id);
            go('organizers');
          }}
        />
      )}
      {section === 'organizers' && (
        <ConsoleOrganizers
          api={api}
          selectedId={organizerId}
          onSelect={setOrganizerId}
          onOpenEvent={(eventId) => {
            setEventFilter(eventId);
            go('bookings');
          }}
        />
      )}
      {section === 'payments' && <ConsolePayments api={api} initialRefund={refundFilter} />}
      {section === 'bookings' && <ConsoleBookings api={api} eventFilter={eventFilter} onClearEvent={() => setEventFilter(null)} />}
      {section === 'activity' && <ConsoleActivity api={api} />}
    </div>
  );
};
