import React, { useEffect, useRef, useState } from 'react';
import { formatKES } from '../../utils/format';

export interface DailyRevenue {
  date: string;
  revenue: number;
  tickets: number;
}

// One series, one brand hue (validated: chroma and 3:1 contrast against the ivory surface)
const BAR = '#9C5226';
const GRID = '#E2D8C9';
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 64 };

/** "2026-10-12" -> "12 Oct" */
const dayLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
};

/** Round the top of the axis up to a tidy number so gridlines land on readable values */
function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value / 4)! * magnitude;
  return Math.ceil(value / step) * step;
}

const compactKES = (value: number) =>
  value >= 1_000_000 ? `KSh ${(value / 1_000_000).toFixed(1)}M` : value >= 1000 ? `KSh ${Math.round(value / 1000)}k` : `KSh ${value}`;

/** Confirmed revenue per day: columns from one baseline, hover for the exact figures, or switch to a table. */
export const RevenueChart: React.FC<{ days: DailyRevenue[] }> = ({ days }) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [showTable]);

  const max = niceMax(Math.max(...days.map((d) => d.revenue), 0));
  const plotW = width - PAD.left - PAD.right;
  const plotH = HEIGHT - PAD.top - PAD.bottom;
  const slot = plotW / Math.max(days.length, 1);
  const barW = Math.max(2, Math.min(24, slot - 2)); // capped thickness, 2px gap between neighbours
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const peak = days.reduce((best, d, i) => (d.revenue > (days[best]?.revenue ?? -1) ? i : best), 0);
  const total = days.reduce((sum, d) => sum + d.revenue, 0);
  const labelEvery = Math.ceil(days.length / Math.max(2, Math.floor(plotW / 64)));

  // Rounded 4px at the data end, square at the baseline
  const barPath = (x: number, top: number, w: number) => {
    const base = PAD.top + plotH;
    const h = base - top;
    if (h <= 0) return '';
    const r = Math.min(4, w / 2, h);
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`;
  };

  const hovered = active !== null ? days[active] : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg font-medium text-[#1E1814]">Confirmed revenue per day</h3>
          <p className="text-xs text-[#675A50]">Last 30 days · {formatKES(total, null)} in total</p>
        </div>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          aria-pressed={showTable}
          className="text-xs text-[#8A4F33] hover:underline cursor-pointer"
        >
          {showTable ? 'Show chart' : 'Show as table'}
        </button>
      </div>

      {showTable ? (
        <div className="max-h-72 overflow-y-auto rounded-xl border border-[#D8CDBC]">
          <table className="w-full text-xs">
            <thead className="bg-[#EFE8DD] text-[#675A50] sticky top-0">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Day</th>
                <th className="text-right font-semibold px-3 py-2">Revenue</th>
                <th className="text-right font-semibold px-3 py-2">Tickets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8CDBC]">
              {[...days].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-1.5 text-[#1E1814]">{dayLabel(d.date)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#1E1814]">{formatKES(d.revenue, null)}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-[#675A50]">{d.tickets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative w-full">
          <svg width={width} height={HEIGHT} role="img" aria-label={`Confirmed revenue per day for the last 30 days, ${formatKES(total, null)} in total`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-[#675A50] text-[10px] tabular-nums">
                  {compactKES(t)}
                </text>
              </g>
            ))}
            {days.map((d, i) => {
              const x = PAD.left + i * slot + (slot - barW) / 2;
              return (
                <g key={d.date}>
                  <path d={barPath(x, y(d.revenue), barW)} fill={BAR} opacity={active === null || active === i ? 1 : 0.55} />
                  {i % labelEvery === 0 && (
                    <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-[#675A50] text-[10px]">
                      {dayLabel(d.date)}
                    </text>
                  )}
                  {/* Hit target: the whole column, much bigger than the bar */}
                  <rect
                    x={PAD.left + i * slot}
                    y={PAD.top}
                    width={slot}
                    height={plotH}
                    fill="transparent"
                    onMouseEnter={() => setActive(i)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    tabIndex={0}
                    aria-label={`${dayLabel(d.date)}: ${formatKES(d.revenue, null)}, ${d.tickets} tickets`}
                  />
                </g>
              );
            })}
            {/* One direct label: the best day */}
            {days[peak]?.revenue > 0 && active === null && (
              <text
                x={PAD.left + peak * slot + slot / 2}
                y={y(days[peak].revenue) - 6}
                textAnchor="middle"
                className="fill-[#1E1814] text-[10px] font-semibold tabular-nums"
              >
                {compactKES(days[peak].revenue)}
              </text>
            )}
          </svg>
          {hovered && active !== null && (
            <div
              role="status"
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-[#1E1814] text-white text-[11px] shadow-sand-lg whitespace-nowrap"
              style={{
                left: Math.min(Math.max(PAD.left + active * slot + slot / 2, 70), width - 70),
                top: Math.max(y(hovered.revenue) - 8, 40)
              }}
            >
              <span className="block font-semibold">{dayLabel(hovered.date)}</span>
              <span className="block tabular-nums">{formatKES(hovered.revenue, null)}</span>
              <span className="block text-white/70 tabular-nums">
                {hovered.tickets} {hovered.tickets === 1 ? 'ticket' : 'tickets'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
