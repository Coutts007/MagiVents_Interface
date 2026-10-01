export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  city?: string;
  joinedDate: string;
  role: 'patron' | 'curator';
  authProvider?: 'google' | 'email';
  googleId?: string;
}

export type AuthModalMode = 'login' | 'signup' | 'forgot-password' | 'reset-sent';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
