import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { ConsoleApi, ConsoleOrganizerDetail, getApiErrorMessage } from '../../services/api';
import { formatKES } from '../../utils/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { EmptyRow, Pager, StatusPill, cardClass, formatDateTime, inputClass, useConsoleList } from './shared';

/** A change that needs a reason, recorded in the activity log */
interface PendingAction {
  title: string;
  description: string;
  confirmLabel: string;
  danger: boolean;
  run: (note: string) => Promise<unknown>;
}

const ActionDialog: React.FC<{ action: PendingAction | null; onClose: () => void; onDone: () => void }> = ({ action, onClose, onDone }) => {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setNote('');
    setError(null);
  }, [action]);
  if (!action) return null;
  return (
    <Modal isOpen onClose={onClose} title={action.title} subtitle={action.description} maxWidth="md">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await action.run(note.trim());
            onDone();
          } catch (err) {
            setError(getApiErrorMessage(err, 'That did not work.'));
          } finally {
            setBusy(false);
          }
        }}
        className="space-y-4"
      >
        <label className="block">
          <span className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">Reason (kept in the activity log)</span>
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} className={`${inputClass} w-full`} />
        </label>
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={action.danger ? 'danger' : 'primary'} disabled={busy}>
            {busy ? 'Saving…' : action.confirmLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

const OrganizerDetail: React.FC<{ api: ConsoleApi; id: string; onBack: () => void; onOpenEvent: (eventId: string) => void }> = ({
  api,
  id,
  onBack,
  onOpenEvent
}) => {
  const [detail, setDetail] = useState<ConsoleOrganizerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const load = () =>
    api
      .organizer(id)
      .then(setDetail)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load this organizer.')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => void load(), [id]);

  if (!detail) {
    return <EmptyRow isLoading={!error} error={error} empty="" />;
  }

  const isOrganizer = detail.role === 'curator';

  return (
    <div className="space-y-5 my-8">
      <button type="button" onClick={onBack} className="text-xs text-[#675A50] hover:text-[#1E1814] inline-flex items-center gap-1 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" /> All organizers
      </button>

      <div className={`${cardClass} p-6 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#1E1814]">{detail.name}</h2>
            <StatusPill status={detail.role} label={isOrganizer ? 'Organizer' : 'Organizer role revoked'} tone={isOrganizer ? 'good' : 'warning'} />
            {!detail.isActive && <StatusPill status="inactive" label="Account disabled" tone="critical" />}
          </div>
          <p className="text-sm text-[#675A50] break-all">{detail.email}</p>
          <p className="text-xs text-[#675A50]">
            Joined {formatDateTime(detail.joinedDate)} · last sign-in {formatDateTime(detail.lastLogin)}
            {detail.city ? ` · ${detail.city}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#675A50]">Revenue</span>
            <span className="font-serif text-xl tabular-nums">{formatKES(detail.revenue, null)}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#675A50]">Tickets sold</span>
            <span className="font-serif text-xl tabular-nums">{detail.ticketsSold}</span>
          </div>
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[#675A50]">Open refunds</span>
            <span className={`font-serif text-xl tabular-nums ${detail.openRefunds ? 'text-red-700' : ''}`}>{detail.openRefunds}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {isOrganizer ? (
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              setPending({
                title: 'Revoke organizer role',
                description: `${detail.name} will no longer be able to create events. Their existing events stay as they are; unpublish them separately if needed.`,
                confirmLabel: 'Revoke role',
                danger: true,
                run: (note) => api.setRole(detail.id, 'patron', note)
              })
            }
          >
            Revoke organizer role
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              setPending({
                title: 'Restore organizer role',
                description: `${detail.name} will be able to create events again.`,
                confirmLabel: 'Restore role',
                danger: false,
                run: (note) => api.setRole(detail.id, 'curator', note)
              })
            }
          >
            Restore organizer role
          </Button>
        )}
      </div>

      <div className={`${cardClass} overflow-hidden`}>
        <div className="px-5 py-4 border-b border-[#D8CDBC]">
          <h3 className="font-serif text-lg font-medium text-[#1E1814]">Events ({detail.events.length})</h3>
        </div>
        {detail.events.length === 0 ? (
          <EmptyRow isLoading={false} error={null} empty="No events." />
        ) : (
          <ul className="divide-y divide-[#D8CDBC]">
            {detail.events.map((event) => (
              <li key={event.id} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[#1E1814] truncate">{event.title}</span>
                    <StatusPill status={event.status} />
                    {event.isFree && <StatusPill status="free" label="Free" />}
                  </div>
                  <p className="text-xs text-[#675A50]">
                    {event.date} · {event.city} · {event.capacity === null ? `${event.ticketsSold} sold` : `${event.ticketsSold}/${event.capacity} sold`}
                    {event.held ? ` · ${event.held} held` : ''} · {formatKES(event.revenue, null)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" onClick={() => onOpenEvent(event.id)}>
                    Bookings
                  </Button>
                  {event.status === 'draft' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPending({
                          title: 'Publish event',
                          description: `"${event.title}" will be visible on MagiVents again.`,
                          confirmLabel: 'Publish',
                          danger: false,
                          run: (note) => api.setEventStatus(event.id, 'published', note)
                        })
                      }
                    >
                      Publish
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        setPending({
                          title: 'Unpublish event',
                          description: `"${event.title}" will be hidden from everyone except its organizer. Existing tickets stay valid.`,
                          confirmLabel: 'Unpublish',
                          danger: true,
                          run: (note) => api.setEventStatus(event.id, 'draft', note)
                        })
                      }
                    >
                      Unpublish
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ActionDialog
        action={pending}
        onClose={() => setPending(null)}
        onDone={() => {
          setPending(null);
          load();
        }}
      />
    </div>
  );
};

export const ConsoleOrganizers: React.FC<{
  api: ConsoleApi;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onOpenEvent: (eventId: string) => void;
}> = ({ api, selectedId, onSelect, onOpenEvent }) => {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('revenue');
  const list = useConsoleList(api.organizers, { search, sort });

  if (selectedId) {
    return <OrganizerDetail api={api} id={selectedId} onBack={() => onSelect(null)} onOpenEvent={onOpenEvent} />;
  }

  return (
    <div className={`${cardClass} overflow-hidden my-8`}>
      <div className="p-5 flex flex-col sm:flex-row gap-3 border-b border-[#D8CDBC]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search organizers"
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort organizers" className={`${inputClass} cursor-pointer`}>
          <option value="revenue">Most revenue</option>
          <option value="events">Most events</option>
          <option value="joined">Newest</option>
          <option value="name">Name</option>
        </select>
      </div>

      {!list.data || list.data.results.length === 0 ? (
        <EmptyRow isLoading={list.isLoading} error={list.error} empty="No organizers match." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#EFE8DD] text-[11px] uppercase tracking-wider text-[#675A50]">
              <tr>
                <th className="text-left font-semibold px-5 py-2.5">Organizer</th>
                <th className="text-left font-semibold px-3 py-2.5">Role</th>
                <th className="text-right font-semibold px-3 py-2.5">Events</th>
                <th className="text-right font-semibold px-3 py-2.5">Tickets</th>
                <th className="text-right font-semibold px-5 py-2.5">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDBC]">
              {list.data.results.map((o) => (
                <tr key={o.id} onClick={() => onSelect(o.id)} className="hover:bg-[#EFE8DD]/60 cursor-pointer">
                  <td className="px-5 py-3">
                    <button type="button" onClick={() => onSelect(o.id)} className="text-left cursor-pointer">
                      <span className="block font-medium text-[#1E1814]">{o.name}</span>
                      <span className="block text-xs text-[#675A50] break-all">{o.email}</span>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={o.role} label={o.role === 'curator' ? 'Organizer' : 'Revoked'} tone={o.role === 'curator' ? 'good' : 'warning'} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">
                    {o.publishedCount}/{o.eventsCount}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums">{o.ticketsSold}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatKES(o.revenue, null)}</td>
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
