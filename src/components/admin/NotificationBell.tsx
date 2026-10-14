import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem, notificationsApi } from '../../services/api';
import { formatDateTime } from '../console/shared';

/** How often the bell asks for new notifications (no websockets: a light poll is enough) */
const POLL_MS = Math.max(10, Number(import.meta.env.VITE_NOTIFICATION_POLL_SECONDS) || 30) * 1000;

export interface NotificationBellProps {
  /** Opens the admin dashboard, e.g. after choosing a notification */
  onOpenDashboard: () => void;
}

/** Admin notifications: new events with a listing fee due, fees paid and failed payments. */
export const NotificationBell: React.FC<NotificationBellProps> = ({ onOpenDashboard }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const load = useCallback(() => {
    notificationsApi
      .list()
      .then((data) => {
        setItems(data.results);
        setUnread(data.unreadCount);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(() => {
      // Skip polls while the tab is hidden
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Esc and clicks outside close the panel
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const markRead = (ids: number[] | 'all') => {
    notificationsApi
      .markRead(ids)
      .then((count) => {
        setUnread(count);
        const now = new Date().toISOString();
        setItems((prev) => prev.map((n) => (ids === 'all' || ids.includes(n.id) ? { ...n, readAt: n.readAt || now } : n)));
      })
      .catch(() => undefined);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          if (!open) load();
        }}
        aria-label={`Admin notifications, ${unread} unread`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative p-2.5 rounded-full text-[#CDBFB2] hover:text-[#F3E9DE] hover:bg-white/10 transition-colors duration-300 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-brand-gold text-[#1E1814] text-[10px] font-bold flex items-center justify-center tabular-nums">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="region"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-ivory rounded-2xl border border-[#D8CDBC] shadow-sand-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          <div className="px-4 py-3 border-b border-[#D8CDBC] flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markRead('all')}
                className="text-[11px] font-medium text-[#8A4F33] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-xs text-center text-[#675A50]">No notifications yet.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto divide-y divide-[#D8CDBC]">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.readAt) markRead([n.id]);
                      setOpen(false);
                      onOpenDashboard();
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-[#E9E2D6]/60 transition-colors cursor-pointer ${n.readAt ? '' : 'bg-[#C7B173]/10'}`}
                  >
                    <span className="flex items-start gap-2">
                      {!n.readAt && <span className="mt-1.5 w-2 h-2 rounded-full bg-[#8A4F33] shrink-0" aria-label="Unread" />}
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-[#1E1814]">{n.title}</span>
                        {n.body && <span className="block text-[11px] text-[#675A50] mt-0.5 leading-relaxed">{n.body}</span>}
                        <span className="block text-[10px] text-[#675A50]/80 mt-1">{formatDateTime(n.createdAt)}</span>
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
