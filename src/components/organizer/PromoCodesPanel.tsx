import React, { useEffect, useState } from 'react';
import { BadgePercent, Plus, Trash2 } from 'lucide-react';
import { EventItem } from '../../types';
import { PromoCode, getApiErrorMessage, promoApi } from '../../services/api';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface PromoCodesPanelProps {
  /** The organizer's own events; codes can only be created for these */
  events: EventItem[];
}

const inputClass =
  'w-full px-3.5 py-2 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';
const labelClass = 'text-[11px] font-semibold text-[#1E1814] uppercase tracking-wider block mb-1';

/** "2026-11-01T10:00" (datetime-local) -> ISO string, or null when empty */
const toIso = (value: string) => (value ? new Date(value).toISOString() : null);

const formatWhen = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

/** Whether the code can be used right now, in display form */
function codeState(code: PromoCode): { label: string; variant: 'sage' | 'sand' | 'neutral' } {
  const now = Date.now();
  if (!code.isActive) return { label: 'Paused', variant: 'sand' };
  if (code.validFrom && new Date(code.validFrom).getTime() > now) return { label: 'Scheduled', variant: 'neutral' };
  if (code.validUntil && new Date(code.validUntil).getTime() < now) return { label: 'Expired', variant: 'sand' };
  if (code.maxUses !== null && code.useCount >= code.maxUses) return { label: 'Used up', variant: 'sand' };
  return { label: 'Active', variant: 'sage' };
}

export const PromoCodesPanel: React.FC<PromoCodesPanelProps> = ({ events }) => {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New code form
  const [eventId, setEventId] = useState('');
  const [code, setCode] = useState('');
  const [percentOff, setPercentOff] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    promoApi
      .list()
      .then(setCodes)
      .catch((err) => setError(getApiErrorMessage(err, 'Could not load your promo codes.')))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const percent = Number(percentOff);
    if (!eventId || !code.trim() || !(percent >= 1 && percent <= 100)) {
      setError('Choose an event, a code and a discount between 1 and 100 percent.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const created = await promoApi.create({
        eventId,
        code: code.trim(),
        percentOff: percent,
        maxUses: maxUses ? Number(maxUses) : null,
        validFrom: toIso(validFrom),
        validUntil: toIso(validUntil),
        isActive: true
      });
      setCodes((prev) => [created, ...prev]);
      setCode('');
      setPercentOff('');
      setMaxUses('');
      setValidFrom('');
      setValidUntil('');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not create this promo code.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (promo: PromoCode) => {
    try {
      const updated = await promoApi.update(promo.id, { isActive: !promo.isActive });
      setCodes((prev) => prev.map((c) => (c.id === promo.id ? updated : c)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not update this promo code.'));
    }
  };

  const remove = async (id: string) => {
    try {
      await promoApi.remove(id);
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not delete this promo code.'));
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const paidEvents = events.filter((event) => !event.isFree);

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form
        onSubmit={handleCreate}
        noValidate
        className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm p-6 space-y-4"
      >
        <div>
          <h2 className="font-serif text-xl font-medium text-[#1E1814]">New promo code</h2>
          <p className="text-xs text-[#675A50] mt-1">
            Attendees enter the code at checkout to get a percentage off. Codes only work for the event you choose.
          </p>
        </div>

        {paidEvents.length === 0 ? (
          <p className="text-xs text-[#675A50] p-4 rounded-xl border border-dashed border-[#D8CDBC] bg-[#EFE8DD]">
            Promo codes apply to paid events. Create a paid event first.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className={labelClass} htmlFor="promo-event">Event *</label>
                <select
                  id="promo-event"
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Choose an event</option>
                  {paidEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="promo-code">Code *</label>
                <input
                  id="promo-code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. EARLYBIRD"
                  maxLength={40}
                  className={`${inputClass} uppercase placeholder:normal-case font-mono`}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="promo-percent">Percent off *</label>
                <input
                  id="promo-percent"
                  type="number"
                  min="1"
                  max="100"
                  inputMode="numeric"
                  value={percentOff}
                  onChange={(e) => setPercentOff(e.target.value)}
                  placeholder="e.g. 20"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="promo-max">Maximum uses</label>
                <input
                  id="promo-max"
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={maxUses}
                  onChange={(e) => setMaxUses(e.target.value)}
                  placeholder="Unlimited"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="promo-from">Valid from</label>
                <input
                  id="promo-from"
                  type="datetime-local"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="promo-until">Valid until</label>
                <input
                  id="promo-until"
                  type="datetime-local"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} disabled={isSaving}>
                {isSaving ? 'Creating…' : 'Create code'}
              </Button>
            </div>
          </>
        )}

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
            {error}
          </div>
        )}
      </form>

      {/* Existing codes */}
      <div className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#D8CDBC] flex items-center gap-2">
          <BadgePercent className="w-4 h-4 text-[#8A4F33]" />
          <h2 className="font-serif text-lg font-medium text-[#1E1814]">Your promo codes</h2>
        </div>

        {isLoading ? (
          <p className="p-6 text-xs text-[#675A50]">Loading promo codes…</p>
        ) : codes.length === 0 ? (
          <p className="p-6 text-sm text-[#675A50]">No promo codes yet.</p>
        ) : (
          <ul className="divide-y divide-[#D8CDBC]">
            {codes.map((promo) => {
              const state = codeState(promo);
              const from = formatWhen(promo.validFrom);
              const until = formatWhen(promo.validUntil);
              return (
                <li key={promo.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-semibold text-[#1E1814]">{promo.code}</span>
                      <Badge variant="charcoal" size="sm">{promo.percentOff}% off</Badge>
                      <Badge variant={state.variant} size="sm">{state.label}</Badge>
                    </div>
                    <p className="text-xs text-[#675A50] truncate">{promo.eventTitle}</p>
                    <p className="text-[11px] text-[#675A50]">
                      Used {promo.useCount}
                      {promo.maxUses !== null ? ` of ${promo.maxUses}` : ''} times
                      {from ? ` · from ${from}` : ''}
                      {until ? ` · until ${until}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="secondary" size="sm" onClick={() => toggleActive(promo)}>
                      {promo.isActive ? 'Pause' : 'Resume'}
                    </Button>
                    {deleteConfirmId === promo.id ? (
                      <>
                        <Button variant="danger" size="sm" onClick={() => remove(promo.id)}>
                          Confirm
                        </Button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-xs text-[#675A50] hover:text-[#1E1814] px-2 py-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(promo.id)}
                        aria-label={`Delete promo code ${promo.code}`}
                        title="Delete promo code"
                        className="p-2.5 rounded-full text-[#675A50] hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
