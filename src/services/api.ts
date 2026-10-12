import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { EventItem, TicketBooking } from '../types';
import { UserProfile } from '../types/auth';

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

export const bookingsApi = {
  list: () => API.get<TicketBooking[]>('/bookings/').then((r) => r.data),
  create: (booking: BookingRequest) => API.post<TicketBooking>('/bookings/', booking).then((r) => r.data)
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
