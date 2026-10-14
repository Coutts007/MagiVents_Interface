import React, { useState } from 'react';
import { Building2, LayoutDashboard, ReceiptText, ShieldCheck, Tags, Users } from 'lucide-react';
import { AdminOverviewPanel } from './AdminOverviewPanel';
import { AdminOrganizers } from './AdminOrganizers';
import { AdminListingFees } from './AdminListingFees';
import { AdminCategoryFees } from './AdminCategoryFees';
import { AdminPlatformPayment } from './AdminPlatformPayment';

export type AdminSection = 'overview' | 'organizers' | 'fees' | 'categories' | 'platform';

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'organizers', label: 'Organizers', icon: Users },
  { id: 'fees', label: 'Listing fees', icon: ReceiptText },
  { id: 'categories', label: 'Category fees', icon: Tags },
  { id: 'platform', label: 'Platform payment', icon: Building2 }
];

/**
 * The admin dashboard: organizers, listing fees, category fees, the platform's payment details and payouts.
 * Shown only to admins; the server refuses every admin call from anyone else (HTTP 403).
 */
export const AdminDashboard: React.FC<{ adminName: string }> = ({ adminName }) => {
  const [section, setSection] = useState<AdminSection>('overview');
  // Lets the overview open an organizer or a filtered list
  const [organizerId, setOrganizerId] = useState<string | null>(null);
  const [feeStatus, setFeeStatus] = useState('');

  const go = (next: AdminSection) => {
    setSection(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#D8CDBC]">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" /> Administration
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#1E1814]">Admin dashboard</h1>
          <p className="text-sm text-[#675A50] mt-1">Signed in as {adminName}. Manage organizers, listing fees and payouts.</p>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Admin sections"
        className="mt-6 bg-[#EFE8DD] p-1 rounded-2xl border border-[#D8CDBC] inline-flex items-center gap-1 shadow-xs overflow-x-auto max-w-full"
      >
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={section === id}
            onClick={() => {
              if (id === 'organizers') setOrganizerId(null);
              if (id === 'fees') setFeeStatus('');
              go(id);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
              section === id ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold' : 'text-[#675A50] hover:text-[#1E1814]'
            }`}
          >
            <Icon className="w-3.5 h-3.5 text-[#8A4F33]" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={SECTIONS.find((s) => s.id === section)?.label}>
        {section === 'overview' && (
          <AdminOverviewPanel
            onOpen={(next, filter) => {
              if (next === 'fees') setFeeStatus(filter || '');
              if (next === 'organizers') setOrganizerId(null);
              go(next);
            }}
          />
        )}
        {section === 'organizers' && <AdminOrganizers selectedId={organizerId} onSelect={setOrganizerId} />}
        {section === 'fees' && (
          <AdminListingFees
            initialStatus={feeStatus}
            onOpenOrganizer={(id) => {
              setOrganizerId(id);
              go('organizers');
            }}
          />
        )}
        {section === 'categories' && <AdminCategoryFees />}
        {section === 'platform' && <AdminPlatformPayment />}
      </div>
    </div>
  );
};
