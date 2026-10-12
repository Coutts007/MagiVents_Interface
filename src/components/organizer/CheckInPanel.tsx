import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Camera, CameraOff, CheckCircle2, Clock, Keyboard, RefreshCw, Search, Users, XCircle } from 'lucide-react';
import { EventItem } from '../../types';
import { AttendeeList, CheckInResult, checkInApi, getApiErrorMessage } from '../../services/api';
import { getQrDetector } from '../../utils/qrScanner';
import { toLocalIsoDate } from '../../utils/format';
import { Button } from '../ui/Button';

export interface CheckInPanelProps {
  /** The organizer's own events */
  events: EventItem[];
}

const inputClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });

/** The event happening soonest (today or later), else the most recent one */
function defaultEventId(events: EventItem[]): string {
  const today = toLocalIsoDate(new Date());
  const upcoming = events.filter((e) => e.isoDate >= today).sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  const past = events.filter((e) => e.isoDate < today).sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  return (upcoming[0] || past[0])?.id || '';
}

const RESULT_STYLES: Record<CheckInResult['result'], { box: string; icon: React.ElementType; title: string }> = {
  checked_in: { box: 'bg-emerald-50 border-emerald-300 text-emerald-900', icon: CheckCircle2, title: 'Checked in' },
  already_checked_in: { box: 'bg-amber-50 border-amber-300 text-amber-900', icon: Clock, title: 'Already checked in' },
  wrong_event: { box: 'bg-red-50 border-red-300 text-red-900', icon: XCircle, title: 'Wrong event' },
  not_found: { box: 'bg-red-50 border-red-300 text-red-900', icon: XCircle, title: 'Ticket not found' }
};

export const CheckInPanel: React.FC<CheckInPanelProps> = ({ events }) => {
  const [eventId, setEventId] = useState(() => defaultEventId(events));
  const [list, setList] = useState<AttendeeList | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [isListLoading, setIsListLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const [mode, setMode] = useState<'scan' | 'type'>('scan');
  const [typedCode, setTypedCode] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Camera
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<{ value: string; at: number }>({ value: '', at: 0 });
  const busyRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const loadAttendees = useCallback(async () => {
    if (!eventId) return;
    setIsListLoading(true);
    setListError(null);
    try {
      setList(await checkInApi.attendees(eventId));
    } catch (err) {
      setListError(getApiErrorMessage(err, 'Could not load the attendee list.'));
    } finally {
      setIsListLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    setResult(null);
    setList(null);
    loadAttendees();
  }, [loadAttendees]);

  const checkIn = useCallback(
    async (ticket: string) => {
      if (!eventId || !ticket.trim() || busyRef.current) return;
      busyRef.current = true;
      setIsChecking(true);
      try {
        setResult(await checkInApi.checkIn(eventId, ticket.trim()));
        loadAttendees();
      } catch (err) {
        setResult({ result: 'not_found', message: getApiErrorMessage(err, 'Could not check this ticket.') });
      } finally {
        busyRef.current = false;
        setIsChecking(false);
      }
    },
    [eventId, loadAttendees]
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError('This browser cannot use the camera here. Type the ticket code instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setCameraError('Camera access was blocked. Allow the camera in your browser settings, or type the ticket code.');
    }
  };

  // Scan a frame a few times a second while the camera is on
  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const tick = async () => {
      if (cancelled) return;
      const video = videoRef.current;
      try {
        if (video && video.readyState >= 2 && !busyRef.current) {
          const detector = await getQrDetector();
          const [value] = await detector.detect(video);
          const now = Date.now();
          // The same code stays in view for a while; only send it again after a pause
          if (value && (value !== lastScanRef.current.value || now - lastScanRef.current.at > 4000)) {
            lastScanRef.current = { value, at: now };
            await checkIn(value);
          }
        }
      } catch {
        if (!cancelled) setCameraError('QR scanning is not available in this browser. Type the ticket code instead.');
      }
      timer = setTimeout(tick, 350);
    };
    tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cameraOn, checkIn]);

  // The camera turns off when leaving the scan mode or this screen
  useEffect(() => {
    if (mode !== 'scan') stopCamera();
  }, [mode, stopCamera]);
  useEffect(() => stopCamera, [stopCamera]);

  const visibleAttendees = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const rows = list?.attendees || [];
    if (!q) return rows;
    return rows.filter((row) =>
      [row.attendeeName, row.attendeeEmail, row.ticketCode, row.tierName].some((text) => text.toLowerCase().includes(q))
    );
  }, [list, filter]);

  if (events.length === 0) {
    return (
      <div className="my-8 p-8 rounded-3xl border border-[#D8CDBC] bg-ivory text-sm text-[#675A50] text-center">
        Create an event first; its attendees can then be checked in here.
      </div>
    );
  }

  const style = result ? RESULT_STYLES[result.result] : null;
  const counts = list?.counts;

  return (
    <div className="my-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Scanner */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm p-5 space-y-4">
          <div>
            <label htmlFor="checkin-event" className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
              Event
            </label>
            <select
              id="checkin-event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} · {event.date}
                </option>
              ))}
            </select>
          </div>

          <div role="tablist" aria-label="Check-in method" className="bg-[#EFE8DD] p-1 rounded-2xl border border-[#D8CDBC] flex">
            {([
              ['scan', 'Scan QR', Camera],
              ['type', 'Type code', Keyboard]
            ] as const).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={mode === id}
                onClick={() => setMode(id)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === id ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold' : 'text-[#675A50] hover:text-[#1E1814]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 text-[#8A4F33]" />
                {label}
              </button>
            ))}
          </div>

          {mode === 'scan' ? (
            <div className="space-y-3">
              <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-[#1E1814]">
                <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${cameraOn ? '' : 'hidden'}`} />
                {cameraOn ? (
                  <div aria-hidden="true" className="absolute inset-[18%] border-2 border-[#C7B173] rounded-2xl pointer-events-none" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-6 text-[#CDBFB2]">
                    <Camera className="w-10 h-10 text-[#C7B173]" />
                    <p className="text-xs">Point the camera at the QR code on the attendee's ticket.</p>
                  </div>
                )}
              </div>
              {cameraOn ? (
                <Button variant="secondary" fullWidth icon={<CameraOff className="w-4 h-4" />} onClick={stopCamera}>
                  Stop camera
                </Button>
              ) : (
                <Button variant="primary" fullWidth icon={<Camera className="w-4 h-4" />} onClick={startCamera}>
                  Start camera
                </Button>
              )}
              {cameraError && (
                <p role="alert" className="text-xs text-red-700">
                  {cameraError}
                </p>
              )}
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                checkIn(typedCode).then(() => setTypedCode(''));
              }}
              className="space-y-3"
            >
              <label htmlFor="checkin-code" className="sr-only">
                Ticket code
              </label>
              <input
                id="checkin-code"
                type="text"
                value={typedCode}
                onChange={(e) => setTypedCode(e.target.value)}
                placeholder="Ticket code, e.g. MV-482913"
                autoComplete="off"
                autoFocus
                className={`${inputClass} font-mono uppercase placeholder:normal-case`}
              />
              <Button type="submit" variant="primary" fullWidth disabled={isChecking || !typedCode.trim()}>
                {isChecking ? 'Checking…' : 'Check in'}
              </Button>
            </form>
          )}
        </div>

        {/* Last result */}
        <div aria-live="polite">
          {result && style && (
            <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 animate-in fade-in ${style.box}`}>
              <style.icon className="w-6 h-6 shrink-0" />
              <div className="text-sm space-y-0.5">
                <p className="font-bold">{style.title}</p>
                <p>{result.message}</p>
                {result.attendee && (
                  <p className="text-xs opacity-80">
                    {result.attendee.ticketCode} · {result.attendee.tierName} · admits {result.attendee.quantity}
                    {result.result === 'already_checked_in' && result.attendee.checkedInAt
                      ? ` · at ${formatTime(result.attendee.checkedInAt)}`
                      : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Attendee list */}
      <div className="lg:col-span-3 bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#D8CDBC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#8A4F33]" />
            <h2 className="font-serif text-lg font-medium text-[#1E1814]">Attendees</h2>
          </div>
          {counts && (
            <span className="text-xs text-[#675A50]">
              <strong className="text-[#1E1814] tabular-nums">{counts.checkedInPeople}</strong> of{' '}
              <strong className="text-[#1E1814] tabular-nums">{counts.people}</strong> people checked in ·{' '}
              {counts.checkedInBookings}/{counts.bookings} tickets
            </span>
          )}
          <button
            type="button"
            onClick={loadAttendees}
            aria-label="Reload attendee list"
            title="Reload"
            className="p-2 rounded-full text-[#675A50] hover:text-[#1E1814] hover:bg-[#E9E2D6] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isListLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {counts && counts.people > 0 && (
          <div className="px-5 pt-4">
            <div className="h-2 rounded-full bg-[#E9E2D6] overflow-hidden" aria-hidden="true">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${Math.round((counts.checkedInPeople / counts.people) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-5 pb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search by name, email or ticket code"
              aria-label="Search attendees"
              className={`${inputClass} pl-9`}
            />
          </div>
        </div>

        {listError ? (
          <p role="alert" className="px-5 pb-5 text-xs text-red-700">
            {listError}
          </p>
        ) : !list ? (
          <p className="px-5 pb-5 text-xs text-[#675A50]">Loading attendees…</p>
        ) : visibleAttendees.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-[#675A50]">{list.attendees.length ? 'No attendee matches.' : 'No bookings yet.'}</p>
        ) : (
          <ul className="divide-y divide-[#D8CDBC] max-h-[32rem] overflow-y-auto">
            {visibleAttendees.map((row) => (
              <li key={row.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1E1814] truncate">{row.attendeeName}</p>
                  <p className="text-[11px] text-[#675A50] truncate">
                    <span className="font-mono">{row.ticketCode}</span> · {row.tierName} × {row.quantity} · {row.attendeeEmail}
                  </p>
                </div>
                {row.checkedInAt ? (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    {formatTime(row.checkedInAt)}
                  </span>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => checkIn(row.id)} disabled={isChecking}>
                    Check in
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
