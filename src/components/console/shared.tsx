import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Page, getApiErrorMessage } from '../../services/api';

export const inputClass =
  'px-3.5 py-2 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';

export const cardClass = 'bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm';

/** "2026-10-12T10:05:00Z" -> "12 Oct 2026, 13:05" (Nairobi time on Kenyan devices) */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const TONES: Record<string, string> = {
  good: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  critical: 'bg-red-50 text-red-800 border-red-200',
  neutral: 'bg-[#E9E2D6] text-[#675A50] border-[#D8CDBC]'
};

const STATUS_TONE: Record<string, keyof typeof TONES> = {
  confirmed: 'good',
  succeeded: 'good',
  published: 'good',
  pending: 'warning',
  sold_out: 'neutral',
  draft: 'neutral',
  expired: 'neutral',
  failed: 'critical'
};

/** Status pill: always text plus a tone, never color alone */
export const StatusPill: React.FC<{ status: string; label?: string; tone?: keyof typeof TONES }> = ({ status, label, tone }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${
      TONES[tone || STATUS_TONE[status] || 'neutral']
    }`}
  >
    {label || status.replace('_', ' ')}
  </span>
);

export const Pager: React.FC<{ page: Page<unknown> | null; onPage: (page: number) => void }> = ({ page, onPage }) => {
  if (!page || page.count <= page.pageSize) return null;
  const last = Math.ceil(page.count / page.pageSize);
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#D8CDBC] text-xs text-[#675A50]">
      <span>
        {(page.page - 1) * page.pageSize + 1}–{Math.min(page.page * page.pageSize, page.count)} of {page.count}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page.page - 1)}
          disabled={page.page <= 1}
          aria-label="Previous page"
          className="p-2 rounded-full hover:bg-[#E9E2D6] disabled:opacity-30 cursor-pointer disabled:cursor-default"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="tabular-nums">
          {page.page} / {last}
        </span>
        <button
          type="button"
          onClick={() => onPage(page.page + 1)}
          disabled={page.page >= last}
          aria-label="Next page"
          className="p-2 rounded-full hover:bg-[#E9E2D6] disabled:opacity-30 cursor-pointer disabled:cursor-default"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/** Loads a paginated console list and reloads when the filters change. */
export function useConsoleList<T>(load: (params: Record<string, string | number | undefined>) => Promise<Page<T>>,
  filters: Record<string, string>) {
  const [data, setData] = useState<Page<T> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const key = JSON.stringify(filters);

  // Back to page 1 whenever a filter changes
  useEffect(() => setPage(1), [key]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page };
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
      setData(await load(params));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load this list.'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page]);

  useEffect(() => {
    // Typing in a search box waits a moment before asking the server
    const timer = setTimeout(reload, 250);
    return () => clearTimeout(timer);
  }, [reload]);

  return { data, setData, page, setPage, error, isLoading, reload };
}

export const EmptyRow: React.FC<{ isLoading: boolean; error: string | null; empty: string }> = ({ isLoading, error, empty }) => (
  <p role={error ? 'alert' : undefined} className={`px-5 py-8 text-sm text-center ${error ? 'text-red-700' : 'text-[#675A50]'}`}>
    {error || (isLoading ? 'Loading…' : empty)}
  </p>
);
