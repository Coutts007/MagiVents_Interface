export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  bio?: string;
  city?: string;
  joinedDate: string;
  role: 'patron' | 'curator';
<<<<<<< HEAD
  authProvider?: 'google' | 'email';
  googleId?: string;
=======
>>>>>>> eecc011 (Save local partial code before merging)
}

export type AuthModalMode = 'login' | 'signup' | 'forgot-password' | 'reset-sent';

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
}
