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
  resetPassword: (email: string) => API.post('/auth/password/reset/', { email }).then((r) => r.data)
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

// --- Gatherings ---------------------------------------------------------------

/** Event payload sent to the backend; server-managed fields are omitted. */
export type EventInput = Omit<EventItem, 'id' | 'attendeeCount' | 'organizerId'>;

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

export const bookmarksApi = {
  list: () => API.get<string[]>('/bookmarks/').then((r) => r.data),
  toggle: (eventId: string) =>
    API.post<{ status: 'bookmarked' | 'unbookmarked' }>(`/bookmarks/toggle/${eventId}/`).then((r) => r.data.status)
};

export default API;
