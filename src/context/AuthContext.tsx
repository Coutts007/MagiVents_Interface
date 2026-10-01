import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/auth';
import { authApi, AuthResponse, getApiErrorMessage, setSessionExpiredHandler, tokenStore } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** True until the stored session (if any) has been checked against the backend */
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  /** Exchanges a Google Identity Services ID token (credential) for a MagiVents session */
  loginWithGoogle: (credential: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(() => Boolean(tokenStore.access));

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  // Restore the session from stored tokens
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    if (tokenStore.access) {
      authApi
        .profile()
        .then(setUser)
        .catch(() => tokenStore.clear())
        .finally(() => setIsInitializing(false));
    }
    return () => setSessionExpiredHandler(null);
  }, []);

  // Runs an API call with loading state, converting API errors into readable Error messages
  const run = async <T,>(action: () => Promise<T>, fallback: string): Promise<T> => {
    setIsLoading(true);
    try {
      return await action();
    } catch (err) {
      throw new Error(getApiErrorMessage(err, fallback));
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = (response: AuthResponse) => {
    tokenStore.set(response.tokens);
    setUser(response.user);
  };

  const login = async (email: string, password: string): Promise<void> => {
    if (!email || !password) {
      throw new Error('Please provide both email and password.');
    }
    const response = await run(() => authApi.login(email.trim(), password), 'Failed to authenticate. Please check your credentials.');
    startSession(response);
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    if (!name.trim()) {
      throw new Error('Full name is required.');
    }
    if (password.length < 8) {
      throw new Error('For security, passwords must be at least 8 characters.');
    }
    const response = await run(() => authApi.register(name.trim(), email.trim(), password), 'Failed to create your account.');
    startSession(response);
  };

  const loginWithGoogle = async (credential: string): Promise<void> => {
    const response = await run(() => authApi.google(credential), 'Google authentication was not completed.');
    startSession(response);
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid email address.');
    }
    await run(() => authApi.resetPassword(email.trim()), 'Could not initiate reset. Please check your email.');
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    const updated = await run(() => authApi.updateProfile(updates), 'Failed to update profile.');
    setUser(updated);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await run(() => authApi.changePassword(currentPassword, newPassword), 'Failed to update password.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isInitializing,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        updateProfile,
        changePassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
