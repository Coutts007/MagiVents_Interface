import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BookingWithPayment, EventItem, ListingFeeSummary, PaymentAttempt, TicketBooking } from '../types';
import { UserProfile } from '../types/auth';
import { PayoutDetails, PayoutDetailsInput } from '../utils/payoutDetails';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const ACCESS_TOKEN_KEY = 'magivents_access_token';
const REFRESH_TOKEN_KEY = 'magivents_refresh_token';

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse {
  tokens: AuthTokens;
  user: UserProfile;
}

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(tokens: AuthTokens) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

const API = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  } as Record<string, string>, // <-- Casting prevents TypeScript header type warnings
});

// Request Interceptor
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStore.access;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Called when the session can no longer be refreshed (AuthContext signs the user out)
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

// Response Interceptor: on 401, refresh the access token once and retry
let refreshPromise: Promise<string> | null = null;

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isRefreshCall = original?.url?.includes('/auth/token/refresh/');

    if (error.response?.status !== 401 || !original || original._retried || isRefreshCall || !tokenStore.refresh) {
      return Promise.reject(error);
    }

    original._retried = true;
    try {
      refreshPromise =
        refreshPromise ||
        API.post('/auth/token/refresh/', { refresh: tokenStore.refresh })
          .then((res) => {
            tokenStore.set({ access: res.data.access, refresh: res.data.refresh || tokenStore.refresh! });
            return res.data.access as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      const access = await refreshPromise;
      original.headers.Authorization = `Bearer ${access}`;
      return API(original);
    } catch (refreshError) {
      tokenStore.clear();
      onSessionExpired?.();
      return Promise.reject(error);
    }
  }
);

/** Turns a DRF error response into a single human-readable message. */
export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }
  if (!error.response) {
    return 'Cannot reach the MagiVents server. Is the backend running?';
  }

  const data = error.response.data as unknown;
  const firstMessage = (value: unknown): string | null => {
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        const msg = firstMessage(item);
        if (msg) return msg;
      }
    }
    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      for (const key of ['error', 'detail', 'non_field_errors']) {
        if (key in obj) {
          const msg = firstMessage(obj[key]);
          if (msg) return msg;
        }
      }
      for (const val of Object.values(obj)) {
        const msg = firstMessage(val);
        if (msg) return msg;
      }
    }
    return null;
  };

  return firstMessage(data) || fallback;
}

// --- Auth -------------------------------------------------------------------

export const authApi = {
  login: (email: string, password: string) =>
    API.post<AuthResponse>('/auth/login/', { email, password }).then((r) => r.data),
  register: (name: string, email: string, password: string) =>
    API.post<AuthResponse>('/auth/register/', { name, email, password }).then((r) => r.data),
  google: (credential: string) =>
    API.post<AuthResponse>('/auth/google/', { credential }).then((r) => r.data),
  profile: () => API.get<UserProfile>('/auth/profile/').then((r) => r.data),
  updateProfile: (updates: Partial<UserProfile>) =>
    API.patch<UserProfile>('/auth/profile/', updates).then((r) => r.data),
  changePassword: (currentPassword: string, newPassword: string) =>
    API.post('/auth/password/change/', { currentPassword, newPassword }).then((r) => r.data),
  resetPassword: (email: string) => API.post('/auth/password/reset/', { email }).then((r) => r.data),
  becomeOrganizer: () => API.post<UserProfile>('/auth/become-organizer/').then((r) => r.data)
};

export async function uploadAvatarFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await API.post('/auth/avatar/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.avatarUrl;
}

// --- Public configuration -----------------------------------------------------

export interface PublicConfig {
  mpesaPaybill: string;
  mpesaAccountName: string;
  /** 'simulated' runs payments against a fake gateway: no real money moves */
  paymentsMode: 'simulated' | 'live';
  /** Which checkout options work with the server's configuration */
  paymentMethods: { mpesaStk: boolean; mpesaPaybill: boolean; card: boolean };
  paymentHoldMinutes: number;
  /** False in live mode: listing fees are paid by hand and confirmed by an admin */
  listingFeeOnline?: boolean;
}

let configPromise: Promise<PublicConfig> | null = null;

/** Non-secret settings from the server, fetched once per page load. */
export function getPublicConfig(): Promise<PublicConfig> {
  configPromise =
    configPromise ||
    API.get<PublicConfig>('/config/')
      .then((r) => r.data)
      .catch((err) => {
        configPromise = null;
        throw err;
      });
  return configPromise;
}

// --- Address search (server proxy to OpenStreetMap Nominatim) -------------------

export interface PlaceResult {
  name: string;
  lat: number;
  lng: number;
}

export const geocodeApi = {
  /** Run only when the organizer presses Search: the OSM policy forbids search-as-you-type */
  search: (query: string) =>
    API.get<{ results: PlaceResult[] }>('/geocode/', { params: { q: query } }).then((r) => r.data.results)
};

// --- Gatherings ---------------------------------------------------------------

/** Event payload sent to the backend; server-managed fields are omitted. */
export type EventInput = Omit<EventItem, 'id' | 'attendeeCount' | 'organizerId' | 'organizerStats'>;

export const gatheringsApi = {
  list: () => API.get<EventItem[]>('/gatherings/').then((r) => r.data),
  create: (event: EventInput) => API.post<EventItem>('/gatherings/', event).then((r) => r.data),
  update: (id: string, event: EventInput) =>
    API.put<EventItem>(`/gatherings/${id}/`, event).then((r) => r.data),
  setStatus: (id: string, status: EventItem['status']) =>
    API.patch<EventItem>(`/gatherings/${id}/`, { status }).then((r) => r.data),
  remove: (id: string) => API.delete(`/gatherings/${id}/`)
};

// --- Listing fee (pay to publish) ----------------------------------------------------

export interface PlatformPaymentDetails {
  method: 'paybill' | 'till';
  methodLabel: string;
  businessNumber: string;
  /** Paybill account number to quote (the event's own reference when the platform sets none) */
  accountNumber: string;
  accountName: string;
  instructions: string;
  isConfigured: boolean;
}

export interface ListingFeeState extends ListingFeeSummary {
  eventId: string;
  eventStatus: EventItem['status'];
  category: string;
  clearedCategory: string | null;
  payment: PaymentAttempt | null;
  platform: PlatformPaymentDetails;
}

/** A refused publish or category change: what is due and why (HTTP 402 / 400 / 403 from the server) */
export interface PublishBlockedError {
  error: string;
  code:
    | 'listing_fee_due'
    | 'listing_fee_pending'
    | 'category_upgrade_due'
    | 'payment_details_missing'
    | 'organizer_suspended'
    | string;
  amountDue?: number;
  eventId?: string;
  category?: string;
  targetCategory?: string;
}

/** The server's reason for refusing to publish, when the error is one of the publishing rules */
export function publishBlockedReason(error: unknown): PublishBlockedError | null {
  if (!axios.isAxiosError(error)) return null;
  const data = error.response?.data as Partial<PublishBlockedError> | undefined;
  return data && typeof data.code === 'string' && typeof data.error === 'string' ? (data as PublishBlockedError) : null;
}

/** Thrown by App when a save or publish is refused by a publishing rule, so the caller can act on it */
export class PublishBlocked extends Error {
  reason: PublishBlockedError;
  constructor(reason: PublishBlockedError) {
    super(reason.error);
    this.reason = reason;
  }
}

export const listingFeeApi = {
  /** Polled by the Pay to publish step; the server also checks a pending payment with the provider */
  get: (eventId: string) =>
    API.get<ListingFeeState>(`/gatherings/${encodeURIComponent(eventId)}/listing-fee/`).then((r) => r.data),
  /** Starts an online payment; `category` pays the difference for moving to a dearer category */
  pay: (eventId: string, mpesaPhoneNumber: string, category?: string) =>
    API.post<ListingFeeState>(`/gatherings/${encodeURIComponent(eventId)}/listing-fee/pay/`, {
      mpesaPhoneNumber,
      ...(category ? { category } : {})
    }).then((r) => r.data)
};

// --- Organizer payment details (where MagiVents pays out ticket money) ---------------

export interface EventPayoutDetails {
  override: PayoutDetails | null;
  effective: PayoutDetails | null;
  usesDefault: boolean;
}

export const payoutsApi = {
  /** The organizer's default details, or null */
  getDetails: () => API.get<{ details: PayoutDetails | null }>('/payouts/details/').then((r) => r.data.details),
  saveDetails: (details: PayoutDetailsInput) =>
    API.put<{ details: PayoutDetails }>('/payouts/details/', details).then((r) => r.data.details),
  removeDetails: () => API.delete('/payouts/details/'),
  /** One event's details (override and the details that apply); owner only */
  getEventDetails: (eventId: string) =>
    API.get<EventPayoutDetails>(`/payouts/events/${encodeURIComponent(eventId)}/details/`).then((r) => r.data),
  saveEventDetails: (eventId: string, details: PayoutDetailsInput) =>
    API.put<EventPayoutDetails>(`/payouts/events/${encodeURIComponent(eventId)}/details/`, details).then((r) => r.data),
  /** Goes back to the organizer's default details */
  removeEventDetails: (eventId: string) =>
    API.delete<EventPayoutDetails>(`/payouts/events/${encodeURIComponent(eventId)}/details/`).then((r) => r.data)
};

// --- Bookings & bookmarks -----------------------------------------------------

export interface BookingRequest {
  eventId: string;
  tierId?: string;
  tierName?: string;
  quantity: number;
  attendeeName: string;
  attendeeEmail: string;
  paymentMethod?: TicketBooking['paymentMethod'];
  mpesaPhoneNumber?: string;
  mpesaReceiptNumber?: string;
  mpesaMode?: TicketBooking['mpesaMode'];
  totalInKes?: number;
  notes?: string;
  promoCode?: string;
}

export interface PayRequest {
  paymentMethod: 'mpesa' | 'card';
  mpesaMode?: 'stk' | 'paybill';
  mpesaPhoneNumber?: string;
}

export const bookingsApi = {
  /** Confirmed bookings of the signed-in user */
  list: () => API.get<TicketBooking[]>('/bookings/').then((r) => r.data),
  /** Free bookings come back confirmed; paid ones come back pending with their payment attempt */
  create: (booking: BookingRequest) => API.post<BookingWithPayment>('/bookings/', booking).then((r) => r.data),
  /** Polled by checkout until the booking is confirmed, failed or expired (works for guests) */
  status: (bookingId: string) => API.get<BookingWithPayment>(`/bookings/${bookingId}/status/`).then((r) => r.data),
  /** Retries payment, or switches method, for the same booking */
  pay: (bookingId: string, request: PayRequest) =>
    API.post<BookingWithPayment>(`/bookings/${bookingId}/pay/`, request).then((r) => r.data)
};

export interface PromoCheck {
  code: string;
  percentOff: number;
  subtotal?: number;
  discount?: number;
  total?: number;
}

export interface PromoCode {
  id: string;
  code: string;
  percentOff: number;
  eventId: string | null;
  eventTitle?: string;
  validFrom: string | null;
  validUntil: string | null;
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
}

export type PromoCodeInput = Pick<PromoCode, 'code' | 'percentOff' | 'validFrom' | 'validUntil' | 'maxUses' | 'isActive'> & {
  eventId: string;
};

export const promoApi = {
  /** Checks a code for an event and returns the server-computed discount; nothing is used up */
  validate: (code: string, eventId: string, tierId: string, quantity: number) =>
    API.post<PromoCheck>('/promo-codes/validate/', { code, eventId, tierId, quantity }).then((r) => r.data),
  list: () => API.get<PromoCode[]>('/promo-codes/').then((r) => r.data),
  create: (input: PromoCodeInput) => API.post<PromoCode>('/promo-codes/', input).then((r) => r.data),
  update: (id: string, input: Partial<PromoCodeInput>) =>
    API.patch<PromoCode>(`/promo-codes/${id}/`, input).then((r) => r.data),
  remove: (id: string) => API.delete(`/promo-codes/${id}/`)
};

// --- Tickets (by booking UUID) and check-in ------------------------------------

export interface AttendeeRow {
  id: string;
  ticketCode: string;
  attendeeName: string;
  attendeeEmail: string;
  tierName: string;
  quantity: number;
  bookingDate: string;
  checkedInAt: string | null;
}

export interface AttendeeList {
  counts: { bookings: number; people: number; checkedInBookings: number; checkedInPeople: number };
  attendees: AttendeeRow[];
}

export interface CheckInResult {
  result: 'checked_in' | 'already_checked_in' | 'wrong_event' | 'not_found';
  message: string;
  attendee?: AttendeeRow;
}

export const ticketsApi = {
  get: (bookingId: string) => API.get<TicketBooking>(`/tickets/${bookingId}/`).then((r) => r.data),
  /** Guests find a ticket with its code and the email they booked with */
  lookup: (ticketCode: string, email: string) =>
    API.post<TicketBooking>('/tickets/lookup/', { ticketCode, email }).then((r) => r.data),
  resend: (bookingId: string) =>
    API.post<{ message: string }>(`/tickets/${bookingId}/resend/`).then((r) => r.data.message),
  pdfUrl: (bookingId: string) => `${BASE_URL}/tickets/${bookingId}/pdf/`
};

export const checkInApi = {
  attendees: (eventId: string) => API.get<AttendeeList>(`/gatherings/${eventId}/attendees/`).then((r) => r.data),
  /** `ticket` may be the scanned QR URL, a booking UUID or a typed ticket code */
  checkIn: (eventId: string, ticket: string) =>
    API.post<CheckInResult>(`/gatherings/${eventId}/check-in/`, { ticket })
      .then((r) => r.data)
      .catch((err) => {
        // Already checked in / wrong event / not found come back as 4xx with a result
        if (axios.isAxiosError(err) && err.response?.data?.result) return err.response.data as CheckInResult;
        throw err;
      })
};

export const bookmarksApi = {
  list: () => API.get<string[]>('/bookmarks/').then((r) => r.data),
  toggle: (eventId: string) =>
    API.post<{ status: 'bookmarked' | 'unbookmarked' }>(`/bookmarks/toggle/${eventId}/`).then((r) => r.data.status)
};

export default API;

// --- Staff console (secret path + staff account; see backend console/access.py) ---------------

export interface Page<T> {
  count: number;
  page: number;
  pageSize: number;
  results: T[];
}

export interface ConsoleSales {
  revenue: number;
  tickets: number;
  bookings: number;
}

export interface ConsoleOverview {
  sales: { allTime: ConsoleSales; last30Days: ConsoleSales; today: ConsoleSales };
  byMethod: { method: string; revenue: number; bookings: number }[];
  daily: { date: string; revenue: number; tickets: number }[];
  bookingsByStatus: Partial<Record<'pending' | 'confirmed' | 'failed' | 'expired', number>>;
  pendingHolds: { bookings: number; tickets: number };
  refundsOpen: { count: number; amount: number };
  paymentsFailedLast7Days: number;
  users: { total: number; organizers: number; newLast30Days: number };
  events: Partial<Record<'published' | 'draft' | 'sold_out', number>>;
  topOrganizers: { id: string; name: string; revenue: number }[];
  paymentsMode: 'simulated' | 'live';
}

export interface ConsoleOrganizer {
  id: string;
  name: string;
  email: string;
  role: 'patron' | 'curator';
  isActive: boolean;
  isStaff: boolean;
  joinedDate: string;
  lastLogin: string | null;
  eventsCount: number;
  publishedCount: number;
  ticketsSold: number;
  revenue: number;
}

export interface ConsoleEventRow {
  id: string;
  title: string;
  date: string;
  isoDate: string;
  city: string;
  status: 'published' | 'draft' | 'sold_out';
  isFree: boolean;
  capacity: number;
  ticketsSold: number;
  held: number;
  revenue: number;
}

export interface ConsoleOrganizerDetail extends ConsoleOrganizer {
  city: string;
  openRefunds: number;
  events: ConsoleEventRow[];
}

export interface ConsolePayment {
  id: string;
  reference: string;
  provider: 'simulated' | 'mpesa_stk' | 'mpesa_paybill' | 'paystack';
  method: 'mpesa' | 'card';
  status: 'pending' | 'succeeded' | 'failed';
  amount: number;
  receiptNumber: string | null;
  providerReference: string | null;
  phoneNumber: string | null;
  failureReason: string | null;
  needsRefund: boolean;
  refundResolvedAt: string | null;
  refundResolvedBy: string | null;
  refundNote: string | null;
  createdAt: string;
  completedAt: string | null;
  booking: {
    id: string;
    status: string;
    ticketCode: string | null;
    attendeeName: string;
    attendeeEmail: string;
    quantity: number;
    totalPrice: number;
  };
  event: { id: string; title: string; organizerEmail: string };
  rawPayloads?: { source: string; payload: unknown }[];
}

export interface ConsoleBooking {
  id: string;
  ticketCode: string | null;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  attendeeName: string;
  attendeeEmail: string;
  isGuest: boolean;
  tierName: string;
  quantity: number;
  totalPrice: number;
  paymentMethod: string;
  bookingDate: string;
  checkedInAt: string | null;
  event: { id: string; title: string };
}

export interface ConsoleActionRow {
  id: number;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  note: string;
  staff: string | null;
  createdAt: string;
}

type Params = Record<string, string | number | undefined>;

/** Every call is scoped to the secret path; the server answers 404 to anyone who is not staff. */
export function consoleApi(secret: string) {
  const base = `/console/${encodeURIComponent(secret)}`;
  const get = <T,>(path: string, params?: Params) => API.get<T>(`${base}${path}`, { params }).then((r) => r.data);
  const post = <T,>(path: string, body: unknown) => API.post<T>(`${base}${path}`, body).then((r) => r.data);
  return {
    session: () => get<{ staff: { name: string; email: string } }>('/session/'),
    overview: () => get<ConsoleOverview>('/overview/'),
    organizers: (params: Params) => get<Page<ConsoleOrganizer>>('/organizers/', params),
    organizer: (id: string) => get<ConsoleOrganizerDetail>(`/organizers/${id}/`),
    setRole: (id: string, role: 'patron' | 'curator', note: string) =>
      post<ConsoleOrganizer>(`/organizers/${id}/role/`, { role, note }),
    setEventStatus: (id: string, status: 'draft' | 'published', note: string) =>
      post<ConsoleEventRow>(`/events/${encodeURIComponent(id)}/status/`, { status, note }),
    payments: (params: Params) => get<Page<ConsolePayment>>('/payments/', params),
    payment: (id: string) => get<ConsolePayment>(`/payments/${id}/`),
    resolveRefund: (id: string, note: string) => post<ConsolePayment>(`/payments/${id}/resolve-refund/`, { note }),
    bookings: (params: Params) => get<Page<ConsoleBooking>>('/bookings/', params),
    actions: (params: Params) => get<Page<ConsoleActionRow>>('/actions/', params)
  };
}

export type ConsoleApi = ReturnType<typeof consoleApi>;

// --- Admin dashboard (role-based: the server answers 403 to anyone who is not an admin) ---------------

export interface AdminOverview {
  organizers: number;
  suspendedOrganizers: number;
  eventsAwaitingPayment: number;
  feesCollectedThisMonth: number;
  feesCollectedAllTime: number;
  balancesOutstanding: number;
  unpaidFeesTotal: number;
  monthStart: string;
}

export interface AdminOrganizer {
  id: string;
  name: string;
  email: string;
  city: string;
  bio: string;
  role: 'patron' | 'curator' | 'admin';
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string;
  isActive: boolean;
  /** False until an invited organizer has set their password */
  hasPassword: boolean;
  joinedDate: string;
  lastLogin: string | null;
  eventsCount: number;
  publishedCount: number;
  bookingsCount: number;
  listingFeesPaid: number;
  ticketsSold: number;
  ticketSales: number;
  earnings: number;
  payoutsTotal: number;
  balance: number;
  paymentDetails: PayoutDetails | null;
}

export interface AdminOrganizerEvent {
  id: string;
  title: string;
  date: string;
  category: string;
  status: EventItem['status'];
  ticketsSold: number;
  revenue: number;
  feeStatus: ListingFeeSummary['status'] | null;
  feeDue: number;
  /** Event-only payment details, when the organizer set some */
  paymentDetails: PayoutDetails | null;
}

export interface EventEarnings {
  eventId: string;
  title: string;
  date: string;
  isoDate: string;
  status: EventItem['status'];
  ticketsSold: number;
  people: number;
  earnings: number;
  discounts: number;
}

export interface PayoutRecord {
  id: number;
  amount: number;
  reference: string;
  paidOn: string;
  note: string;
  sentTo: string;
  recordedBy: string | null;
  createdAt: string;
}

export interface AdminOrganizerDetail extends AdminOrganizer {
  events: AdminOrganizerEvent[];
  eventEarnings: EventEarnings[];
  payouts: PayoutRecord[];
}

export interface CategoryFeeRow {
  category: string;
  amount: number;
  updatedAt: string | null;
  updatedBy: string | null;
  eventsAwaitingPayment: number;
}

export interface PlatformPaymentSettings {
  method: 'paybill' | 'till';
  businessNumber: string;
  accountNumber: string;
  accountName: string;
  instructions: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
}

export interface AdminListingFee {
  eventId: string;
  eventTitle: string;
  eventStatus: EventItem['status'];
  category: string;
  organizer: { id: string; name: string; email: string };
  status: ListingFeeSummary['status'];
  amountDue: number;
  categoryFee: number;
  amountPaid: number;
  amountWaived: number;
  reference: string;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  grandfathered: boolean;
  waivedBy: string | null;
  waivedAt: string | null;
  waiveReason: string | null;
  markedPaidBy: string | null;
  markedPaidAt: string | null;
  markPaidReason: string | null;
  latestPayment: { status: string; provider: string; amount: number; failureReason: string | null; createdAt: string } | null;
}

export interface AdminListingFeePage extends Page<AdminListingFee> {
  totals: {
    count: number;
    byStatus: Partial<Record<ListingFeeSummary['status'], number>>;
    amountPaid: number;
    amountWaived: number;
    amountUnpaid: number;
  };
}

export interface NotificationItem {
  id: number;
  kind: 'listing_fee_due' | 'listing_fee_paid' | 'listing_fee_failed' | string;
  title: string;
  body: string;
  eventId: string | null;
  createdAt: string;
  readAt: string | null;
}

export const adminApi = {
  overview: () => API.get<AdminOverview>('/admin/overview/').then((r) => r.data),
  organizers: (params: Params) => API.get<Page<AdminOrganizer>>('/admin/organizers/', { params }).then((r) => r.data),
  organizer: (id: string) => API.get<AdminOrganizerDetail>(`/admin/organizers/${id}/`).then((r) => r.data),
  createOrganizer: (input: { name: string; email: string; city?: string; bio?: string }) =>
    API.post<AdminOrganizer & { inviteSent: boolean }>('/admin/organizers/', input).then((r) => r.data),
  updateOrganizer: (id: string, input: Partial<Pick<AdminOrganizer, 'name' | 'email' | 'city' | 'bio' | 'role'>>) =>
    API.patch<AdminOrganizer>(`/admin/organizers/${id}/`, input).then((r) => r.data),
  deleteOrganizer: (id: string, confirmEmail: string) =>
    API.delete(`/admin/organizers/${id}/`, { data: { confirmEmail } }),
  resendInvite: (id: string) =>
    API.post<{ message: string }>(`/admin/organizers/${id}/resend-invite/`).then((r) => r.data.message),
  savePaymentDetails: (id: string, details: PayoutDetailsInput) =>
    API.put<{ details: PayoutDetails }>(`/admin/organizers/${id}/payment-details/`, details).then((r) => r.data.details),
  removePaymentDetails: (id: string) => API.delete(`/admin/organizers/${id}/payment-details/`),
  suspend: (id: string, reason: string, takeDownEvents: boolean) =>
    API.post<AdminOrganizer & { eventsTakenDown: number }>(`/admin/organizers/${id}/suspend/`, { reason, takeDownEvents }).then(
      (r) => r.data
    ),
  reactivate: (id: string) => API.post<AdminOrganizer>(`/admin/organizers/${id}/reactivate/`).then((r) => r.data),
  categoryFees: () => API.get<{ fees: CategoryFeeRow[] }>('/admin/category-fees/').then((r) => r.data.fees),
  saveCategoryFees: (fees: { category: string; amount: number }[]) =>
    API.put<{ fees: CategoryFeeRow[] }>('/admin/category-fees/', { fees }).then((r) => r.data.fees),
  platformPayment: () => API.get<PlatformPaymentSettings>('/admin/platform-payment/').then((r) => r.data),
  savePlatformPayment: (input: PlatformPaymentSettings) =>
    API.put<PlatformPaymentSettings>('/admin/platform-payment/', input).then((r) => r.data),
  listingFees: (params: Params) =>
    API.get<AdminListingFeePage>('/admin/listing-fees/', { params }).then((r) => r.data),
  waiveFee: (eventId: string, reason: string) =>
    API.post<AdminListingFee>(`/admin/listing-fees/${encodeURIComponent(eventId)}/waive/`, { reason }).then((r) => r.data),
  markFeePaid: (eventId: string, reason: string, reference: string) =>
    API.post<AdminListingFee>(`/admin/listing-fees/${encodeURIComponent(eventId)}/mark-paid/`, { reason, reference }).then(
      (r) => r.data
    )
};

export const notificationsApi = {
  list: (limit = 20) =>
    API.get<{ unreadCount: number; results: NotificationItem[] }>('/notifications/', { params: { limit } }).then((r) => r.data),
  markRead: (ids: number[] | 'all') =>
    API.post<{ unreadCount: number }>('/notifications/read/', ids === 'all' ? { all: true } : { ids }).then(
      (r) => r.data.unreadCount
    )
};
