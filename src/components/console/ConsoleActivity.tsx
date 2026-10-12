import React from 'react';
import { ConsoleApi } from '../../services/api';
import { EmptyRow, Pager, cardClass, formatDateTime, useConsoleList } from './shared';

const ACTION_LABELS: Record<string, string> = {
  resolve_refund: 'Marked refund settled',
  revoke_organizer: 'Revoked organizer role',
  grant_organizer: 'Restored organizer role',
  unpublish_event: 'Unpublished event',
  publish_event: 'Published event'
};

/** Everything staff changed from the console, newest first */
export const ConsoleActivity: React.FC<{ api: ConsoleApi }> = ({ api }) => {
  const list = useConsoleList(api.actions, {});
  return (
    <div className={`${cardClass} overflow-hidden my-8`}>
      <div className="px-5 py-4 border-b border-[#D8CDBC]">
        <h2 className="font-serif text-lg font-medium text-[#1E1814]">Staff activity</h2>
        <p className="text-xs text-[#675A50]">Every change made from this console, with who made it and why.</p>
      </div>
      {!list.data || list.data.results.length === 0 ? (
        <EmptyRow isLoading={list.isLoading} error={list.error} empty="Nothing changed yet." />
      ) : (
        <ul className="divide-y divide-[#D8CDBC]">
          {list.data.results.map((a) => (
            <li key={a.id} className="px-5 py-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-[#1E1814]">
                  <strong className="font-semibold">{ACTION_LABELS[a.action] || a.action}</strong> · {a.targetLabel || a.targetId}
                </span>
                <span className="text-xs text-[#675A50]">
                  {formatDateTime(a.createdAt)} · {a.staff || 'unknown'}
                </span>
              </div>
              {a.note && <p className="text-xs text-[#675A50] mt-1">“{a.note}”</p>}
            </li>
          ))}
        </ul>
      )}
      <Pager page={list.data} onPage={list.setPage} />
    </div>
  );
};
