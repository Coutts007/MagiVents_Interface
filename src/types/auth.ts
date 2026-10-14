export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  city?: string;
  joinedDate: string;
  /** Attendee, organizer, or platform admin (admins can also organize events) */
  role: 'patron' | 'curator' | 'admin';
  /** A suspended organizer can sign in and see their events but cannot create or publish */
  isSuspended?: boolean;
  suspensionReason?: string;
  authProvider?: 'google' | 'email';
  googleId?: string;
}

export type AuthModalMode = 'login' | 'signup' | 'forgot-password' | 'reset-sent';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
