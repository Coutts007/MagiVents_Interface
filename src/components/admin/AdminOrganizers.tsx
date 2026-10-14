import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail, Pencil, PlusCircle, Search, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import {
  AdminOrganizer,
  AdminOrganizerDetail,
  adminApi,
  getApiErrorMessage
} from '../../services/api';
import { formatKES } from '../../utils/format';
import { PayoutDetailsInput, payoutDetailsError, toPayoutInput } from '../../utils/payoutDetails';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { PayoutDetailsFields } from '../organizer/PayoutDetailsFields';
import { EmptyRow, Pager, StatusPill, cardClass, formatDateTime, inputClass, useConsoleList } from '../console/shared';
import { ReasonDialog } from './ReasonDialog';

const fieldClass = `${inputClass} w-full`;
const FEE_LABEL: Record<string, string> = { unpaid: 'Fee unpaid', pending: 'Fee pending', paid: 'Fee paid', waived: 'Fee waived', exempt: 'No fee' };

const OrganizerStatus: React.FC<{ organizer: AdminOrganizer }> = ({ organizer }) => {
  if (organizer.isSuspended) return <StatusPill status="suspended" label="Suspended" tone="critical" />;
  if (organizer.role !== 'curator' && organizer.role !== 'admin') return <StatusPill status="patron" label="Not an organizer" tone="neutral" />;
  if (!organizer.hasPassword) return <StatusPill status="invited" label="Invited" tone="warning" />;
  return <StatusPill status="active" label="Active" tone="good" />;
};

export const AdminOrganizers: React.FC<{ selectedId: string | null; onSelect: (id: string | null) => void }> = ({
  selectedId,
  onSelect
}) => {
  if (selectedId) return <OrganizerDetail id={selectedId} onBack={() => onSelect(null)} />;
  return <OrganizerList onSelect={onSelect} />;
};

// --- List ------------------------------------------------------------------------------------------------

const OrganizerList: React.FC<{ onSelect: (id: string) => void }> = ({ onSelect }) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [sort, setSort] = useState('name');
  const [isCreating, setIsCreating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const { data, page, setPage, error, isLoading, reload } = useConsoleList<AdminOrganizer>(adminApi.organizers, {
    search,
    status,
    role,
    sort
  });

  return (
    <div className="space-y-5 my-8">
      <div className="flex flex-col lg:flex-row lg:items-end gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <label className="relative">
            <span className="sr-only">Search organizers</span>
            <Search className="w-4 h-4 text-[#675A50] absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or town"
              className={`${inputClass} pl-9 w-64 max-w-full`} />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="invited">Invited (no password yet)</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Role</span>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass}>
              <option value="">Organizers and former organizers</option>
              <option value="curator">Organizers</option>
              <option value="patron">Attendees who own events</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputClass}>
              <option value="name">Name</option>
              <option value="joined">Newest</option>
              <option value="events">Most events</option>
              <option value="sales">Highest ticket sales</option>
              <option value="fees">Most listing fees paid</option>
            </select>
          </label>
        </div>
        <Button variant="primary" icon={<PlusCircle className="w-4 h-4" />} onClick={() => setIsCreating(true)}>
          Add organizer
        </Button>
      </div>

      {notice && (
        <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{notice}</div>
      )}

      <div className={`${cardClass} overflow-hidden`}>
        {!data || data.results.length === 0 ? (
          <EmptyRow isLoading={isLoading} error={error} empty="No organizers match." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Organizers</caption>
              <thead className="text-[11px] uppercase tracking-wider text-[#675A50] bg-[#E9E2D6]/40">
                <tr>
                  <th scope="col" className="text-left px-5 py-3 font-semibold">Organizer</th>
                  <th scope="col" className="text-left px-3 py-3 font-semibold">Status</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Events</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Listing fees paid</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Ticket sales</th>
                  <th scope="col" className="text-right px-3 py-3 font-semibold">Balance</th>
                  <th scope="col" className="text-left px-5 py-3 font-semibold">Payment details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBC]">
                {data.results.map((o) => (
                  <tr key={o.id} className="hover:bg-[#E9E2D6]/30">
                    <td className="px-5 py-3">
                      <button type="button" onClick={() => onSelect(o.id)}
                        className="text-left font-medium text-[#1E1814] hover:text-[#8A4F33] hover:underline cursor-pointer">
                        {o.name}
                      </button>
                      <span className="block text-xs text-[#675A50] break-all">{o.email}</span>
                    </td>
                    <td className="px-3 py-3"><OrganizerStatus organizer={o} /></td>
                    <td className="px-3 py-3 text-right tabular-nums">{o.publishedCount}/{o.eventsCount}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatKES(o.listingFeesPaid, 'KSh 0')}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatKES(o.ticketSales, 'KSh 0')}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-medium">{formatKES(o.balance, 'KSh 0')}</td>
                    <td className="px-5 py-3 text-xs text-[#675A50]">{o.paymentDetails?.summary || <span className="text-amber-700">Not set</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pager page={data} onPage={setPage} />
      </div>
      <span className="sr-only" aria-live="polite">{data ? `${data.count} organizers, page ${page}` : ''}</span>

      <CreateOrganizerModal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreated={(organizer, inviteSent) => {
          setNotice(
            inviteSent
              ? `${organizer.name} was added. An email with a link to set their password was sent to ${organizer.email}.`
              : `${organizer.name} was added, but the invitation email could not be sent. Use Resend invitation on their page.`
          );
          reload();
        }}
      />
    </div>
  );
};

const CreateOrganizerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onCreated: (organizer: AdminOrganizer, inviteSent: boolean) => void;
}> = ({ isOpen, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', city: '', bio: '' });
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ name: '', email: '', city: '', bio: '' });
      setError(null);
    }
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setError('Enter the organizer\'s name and a valid email address.');
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const created = await adminApi.createOrganizer(form);
      onCreated(created, created.inviteSent);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not add the organizer.'));
    } finally {
      setIsBusy(false);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add an organizer"
      subtitle="They receive an email with a link to set their password." maxWidth="md">
      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Name *<input value={form.name} onChange={set('name')} className={`${fieldClass} mt-1`} autoFocus />
        </label>
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Email *<input type="email" value={form.email} onChange={set('email')} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Town<input value={form.city} onChange={set('city')} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Bio<textarea rows={3} value={form.bio} onChange={set('bio')} className={`${fieldClass} mt-1`} />
        </label>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isBusy}>{isBusy ? 'Adding…' : 'Add and send invitation'}</Button>
        </div>
      </form>
    </Modal>
  );
};

// --- Detail ----------------------------------------------------------------------------------------------

const OrganizerDetail: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const [detail, setDetail] = useState<AdminOrganizerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [dialog, setDialog] = useState<'suspend' | 'delete' | 'edit' | null>(null);

  const load = () =>
    adminApi
      .organizer(id)
      .then(setDetail)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load this organizer.')));

  useEffect(() => {
    load();
  }, [id]);

  if (!detail) return <EmptyRow isLoading={!error} error={error} empty="" />;

  const run = async (action: () => Promise<unknown>, message: string) => {
    setNotice(null);
    setError(null);
    try {
      await action();
      setNotice(message);
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const publishedCount = detail.events.filter((e) => e.status !== 'draft').length;

  return (
    <div className="space-y-6 my-8">
      <button type="button" onClick={onBack}
        className="text-xs text-[#675A50] hover:text-[#1E1814] inline-flex items-center gap-1 cursor-pointer">
        <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> All organizers
      </button>

      <div className={`${cardClass} p-6 flex flex-col md:flex-row md:items-start justify-between gap-4`}>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-2xl font-medium text-[#1E1814]">{detail.name}</h2>
            <OrganizerStatus organizer={detail} />
          </div>
          <p className="text-sm text-[#675A50] break-all">{detail.email}</p>
          <p className="text-xs text-[#675A50]">
            {[detail.city, `joined ${formatDateTime(detail.joinedDate)}`, detail.lastLogin ? `last seen ${formatDateTime(detail.lastLogin)}` : 'never signed in']
              .filter(Boolean)
              .join(' · ')}
          </p>
          {detail.isSuspended && (
            <p className="text-xs text-red-800 mt-2">
              Suspended {formatDateTime(detail.suspendedAt)}: {detail.suspensionReason}
            </p>
          )}
          {detail.bio && <p className="text-sm text-[#1E1814] mt-2 max-w-2xl">{detail.bio}</p>}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button variant="secondary" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => setDialog('edit')}>
            Edit
          </Button>
          {!detail.hasPassword && (
            <Button variant="secondary" size="sm" icon={<Mail className="w-3.5 h-3.5" />}
              onClick={() => run(() => adminApi.resendInvite(detail.id), `Invitation sent again to ${detail.email}.`)}>
              Resend invitation
            </Button>
          )}
          {detail.role !== 'admin' &&
            (detail.isSuspended ? (
              <Button variant="secondary" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}
                onClick={() => run(() => adminApi.reactivate(detail.id), 'Organizer reactivated. Their events stay as they are; they can publish again.')}>
                Reactivate
              </Button>
            ) : (
              <Button variant="outline" size="sm" icon={<ShieldOff className="w-3.5 h-3.5" />} onClick={() => setDialog('suspend')}>
                Suspend
              </Button>
            ))}
          {detail.role !== 'admin' && (
            <Button variant="danger" size="sm" icon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => setDialog('delete')}>
              Delete
            </Button>
          )}
        </div>
      </div>

      {notice && <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">{notice}</div>}
      {error && <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Events', `${publishedCount} live / ${detail.eventsCount}`],
          ['Listing fees paid', formatKES(detail.listingFeesPaid, 'KSh 0')],
          ['Ticket sales', formatKES(detail.ticketSales, 'KSh 0')],
          ['Balance outstanding', formatKES(detail.balance, 'KSh 0')]
        ].map(([label, value]) => (
          <div key={label} className={`${cardClass} p-4`}>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#675A50]">{label}</span>
            <span className="block font-serif text-xl text-[#1E1814] tabular-nums mt-1">{value}</span>
          </div>
        ))}
      </div>

      <PaymentDetailsSection detail={detail} onSaved={(message) => run(async () => undefined, message)} />

      <section className={`${cardClass} overflow-hidden`} aria-labelledby="organizer-events">
        <h3 id="organizer-events" className="px-5 py-4 border-b border-[#D8CDBC] font-serif text-lg text-[#1E1814]">Events</h3>
        {detail.events.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#675A50]">No events yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-[#675A50] bg-[#E9E2D6]/40">
                <tr>
                  <th scope="col" className="text-left px-5 py-2 font-semibold">Event</th>
                  <th scope="col" className="text-left px-3 py-2 font-semibold">Status</th>
                  <th scope="col" className="text-left px-3 py-2 font-semibold">Listing fee</th>
                  <th scope="col" className="text-right px-3 py-2 font-semibold">Tickets</th>
                  <th scope="col" className="text-right px-3 py-2 font-semibold">Sales</th>
                  <th scope="col" className="text-left px-5 py-2 font-semibold">Paid out to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D8CDBC]">
                {detail.events.map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-2.5">
                      <span className="font-medium text-[#1E1814]">{e.title}</span>
                      <span className="block text-xs text-[#675A50]">{e.date} · {e.category}</span>
                    </td>
                    <td className="px-3 py-2.5"><StatusPill status={e.status} /></td>
                    <td className="px-3 py-2.5 text-xs">
                      {e.feeStatus ? FEE_LABEL[e.feeStatus] : '—'}
                      {e.feeDue > 0 && <span className="block text-[#675A50]">{formatKES(e.feeDue)} due</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{e.ticketsSold}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatKES(e.revenue, 'KSh 0')}</td>
                    <td className="px-5 py-2.5 text-xs text-[#675A50]">
                      {e.paymentDetails ? `${e.paymentDetails.summary} (this event)` : 'Default details'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EditOrganizerModal
        isOpen={dialog === 'edit'}
        organizer={detail}
        onClose={() => setDialog(null)}
        onSaved={() => run(async () => undefined, 'Organizer details saved.')}
      />
      <ReasonDialog
        isOpen={dialog === 'suspend'}
        title={`Suspend ${detail.name}`}
        description="They can still sign in and see their events and sales, but cannot create or publish events until reactivated."
        confirmLabel="Suspend organizer"
        danger
        checkbox={{
          label: `Also take down their ${publishedCount} published ${publishedCount === 1 ? 'event' : 'events'} (back to draft; ticket holders keep their tickets)`,
          defaultChecked: false
        }}
        onClose={() => setDialog(null)}
        onConfirm={async (reason, _extra, takeDown) => {
          const result = await adminApi.suspend(detail.id, reason, takeDown);
          setNotice(`Organizer suspended${result.eventsTakenDown ? `; ${result.eventsTakenDown} events taken down` : ''}.`);
          await load();
        }}
      />
      <DeleteOrganizerModal
        isOpen={dialog === 'delete'}
        organizer={detail}
        onClose={() => setDialog(null)}
        onSuspendInstead={() => setDialog('suspend')}
        onDeleted={onBack}
      />
    </div>
  );
};

const PaymentDetailsSection: React.FC<{ detail: AdminOrganizerDetail; onSaved: (message: string) => void }> = ({ detail, onSaved }) => {
  const [form, setForm] = useState<PayoutDetailsInput>(toPayoutInput(detail.paymentDetails));
  const [errorField, setErrorField] = useState<keyof PayoutDetailsInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => setForm(toPayoutInput(detail.paymentDetails)), [detail.paymentDetails]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = payoutDetailsError(form);
    setErrorField(problem?.field ?? null);
    setError(problem?.message ?? null);
    if (problem) return;
    setIsBusy(true);
    try {
      await adminApi.savePaymentDetails(detail.id, form);
      onSaved('Payment details saved.');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <section className={`${cardClass} p-5 sm:p-6 space-y-4`} aria-labelledby="organizer-payment-details">
      <div>
        <h3 id="organizer-payment-details" className="font-serif text-lg text-[#1E1814]">Payment details</h3>
        <p className="text-xs text-[#675A50] mt-1">
          Where the platform pays out this organizer's ticket sales.{' '}
          {detail.paymentDetails ? `Current: ${detail.paymentDetails.summary}.` : 'None set yet: their paid events cannot be published.'}
        </p>
      </div>
      <form onSubmit={save} noValidate className="space-y-4">
        <PayoutDetailsFields value={form} onChange={setForm} errorField={errorField} disabled={isBusy} />
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          {detail.paymentDetails && (
            <Button type="button" variant="ghost" disabled={isBusy}
              onClick={async () => {
                setIsBusy(true);
                try {
                  await adminApi.removePaymentDetails(detail.id);
                  onSaved('Payment details removed.');
                } catch (err) {
                  setError(getApiErrorMessage(err));
                } finally {
                  setIsBusy(false);
                }
              }}>
              Remove
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isBusy}>{isBusy ? 'Saving…' : 'Save payment details'}</Button>
        </div>
      </form>
    </section>
  );
};

const EditOrganizerModal: React.FC<{
  isOpen: boolean;
  organizer: AdminOrganizer;
  onClose: () => void;
  onSaved: () => void;
}> = ({ isOpen, organizer, onClose, onSaved }) => {
  const [form, setForm] = useState({ name: '', email: '', city: '', bio: '', role: organizer.role });
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({ name: organizer.name, email: organizer.email, city: organizer.city, bio: organizer.bio, role: organizer.role });
      setError(null);
    }
  }, [isOpen, organizer]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    try {
      const { role, ...rest } = form;
      await adminApi.updateOrganizer(organizer.id, organizer.role === 'admin' ? rest : { ...rest, role });
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save.'));
    } finally {
      setIsBusy(false);
    }
  };

  const set = (field: 'name' | 'email' | 'city' | 'bio') => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit organizer" maxWidth="md">
      <form onSubmit={submit} noValidate className="space-y-4">
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Name<input value={form.name} onChange={set('name')} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Email<input type="email" value={form.email} onChange={set('email')} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Town<input value={form.city} onChange={set('city')} className={`${fieldClass} mt-1`} />
        </label>
        <label className="block text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
          Bio<textarea rows={3} value={form.bio} onChange={set('bio')} className={`${fieldClass} mt-1`} />
        </label>
        {organizer.role === 'admin' ? (
          <p className="text-xs text-[#675A50]">This account is an administrator; admin access is managed in the Django admin.</p>
        ) : (
          <fieldset>
            <legend className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider mb-1">Role</legend>
            <div className="flex gap-4 text-sm">
              {(['curator', 'patron'] as const).map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="organizer-role" checked={form.role === role}
                    onChange={() => setForm((f) => ({ ...f, role }))} className="accent-[#8A4F33]" />
                  {role === 'curator' ? 'Organizer' : 'Attendee (cannot create events)'}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={isBusy}>{isBusy ? 'Saving…' : 'Save'}</Button>
        </div>
      </form>
    </Modal>
  );
};

const DeleteOrganizerModal: React.FC<{
  isOpen: boolean;
  organizer: AdminOrganizer;
  onClose: () => void;
  onSuspendInstead: () => void;
  onDeleted: () => void;
}> = ({ isOpen, organizer, onClose, onSuspendInstead, onDeleted }) => {
  const [typed, setTyped] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const blocked = organizer.bookingsCount > 0 || organizer.listingFeesPaid > 0;

  useEffect(() => {
    if (isOpen) {
      setTyped('');
      setError(null);
    }
  }, [isOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    setError(null);
    try {
      await adminApi.deleteOrganizer(organizer.id, typed);
      onClose();
      onDeleted();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete this organizer.'));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Delete ${organizer.name}`} maxWidth="md">
      {blocked ? (
        <div className="space-y-4 text-sm text-[#675A50]">
          <p>
            This organizer's events have {organizer.bookingsCount > 0 ? `${organizer.bookingsCount} bookings` : 'paid listing fees'},
            so the account cannot be deleted: ticket holders and financial records must be kept.
          </p>
          <p>Suspend the organizer instead. They will not be able to create or publish events.</p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="primary" onClick={onSuspendInstead}>Suspend instead</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <p className="text-sm text-[#675A50]">
            This permanently deletes the account, its {organizer.eventsCount} events and its payment details. It cannot be undone.
          </p>
          <label className="block text-xs font-semibold text-[#1E1814]">
            Type <span className="font-mono">{organizer.email}</span> to confirm
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off"
              className={`${fieldClass} mt-1`} aria-describedby="delete-help" />
          </label>
          <p id="delete-help" className="sr-only">The delete button is enabled once the email matches.</p>
          {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={isBusy || typed.trim().toLowerCase() !== organizer.email.toLowerCase()}>
              {isBusy ? 'Deleting…' : 'Delete permanently'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
