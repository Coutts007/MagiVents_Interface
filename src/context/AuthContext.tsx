import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/auth';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: (googleAccount?: { name?: string; email?: string; avatarUrl?: string }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  logout: () => void;
}

const DEFAULT_USER: UserProfile = {
  id: 'usr-elena-rostova',
  name: 'Elena Rostova',
  email: 'elena.rostova@atelier.com',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  bio: 'Patron of chamber acoustics, biodynamic viticulture, and contemporary ceramic arts.',
  city: 'Avignon & Paris',
  joinedDate: 'October 2024',
  role: 'patron'
};

const STORAGE_AUTH_USER = 'magivents_auth_user_v2';
const STORAGE_REGISTERED_USERS = 'magivents_registered_users_v2';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_USER);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }
    return DEFAULT_USER; // Start with active patron for immediate preview
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync current user to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_AUTH_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_AUTH_USER);
      }
    } catch (e) {
      console.warn('Failed to write auth user to storage', e);
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 650));

    if (!email || !password) {
      setIsLoading(false);
      throw new Error('Please provide both email and password.');
    }

    if (!email.includes('@') || !email.includes('.')) {
      setIsLoading(false);
      throw new Error('Please enter a valid email address.');
    }

    if (password.length < 6) {
      setIsLoading(false);
      throw new Error('Password must be at least 6 characters.');
    }

    // Check if user is in registered users store
    try {
      const storedUsers = localStorage.getItem(STORAGE_REGISTERED_USERS);
      const registered: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
      const match = registered.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (match) {
        setUser(match);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Error reading registered users', e);
    }

    // Default patron fallback or generate session
    const patronUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      avatarUrl: DEFAULT_USER.avatarUrl,
      bio: 'Enthusiast of intimate cultural gatherings and artisanal crafts.',
      city: 'Provence Basin',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      role: 'patron'
    };

    setUser(patronUser);
    setIsLoading(false);
  };

  const signup = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 750));

    if (!name.trim()) {
      setIsLoading(false);
      throw new Error('Full name is required.');
    }

    if (!email.includes('@') || !email.includes('.')) {
      setIsLoading(false);
      throw new Error('Please provide a valid email address.');
    }

    if (password.length < 8) {
      setIsLoading(false);
      throw new Error('For security, passwords must be at least 8 characters.');
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      bio: 'New member exploring curated musical, culinary, and design salons.',
      city: 'Florence & Provence',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      role: 'patron'
    };

    // Save to registered pool
    try {
      const storedUsers = localStorage.getItem(STORAGE_REGISTERED_USERS);
      const registered: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
      localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify([newUser, ...registered]));
    } catch (e) {
      console.warn('Error saving new user', e);
    }

    setUser(newUser);
    setIsLoading(false);
  };

  const loginWithGoogle = async (googleAccount?: { name?: string; email?: string; avatarUrl?: string }): Promise<void> => {
    setIsLoading(true);
    // Simulate Google Identity Services verification
    await new Promise((resolve) => setTimeout(resolve, 600));

    const email = googleAccount?.email || 'petershemaya007@gmail.com';
    const name = googleAccount?.name || 'Peter Shemaya';
    const avatarUrl =
      googleAccount?.avatarUrl ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';

    try {
      const storedUsers = localStorage.getItem(STORAGE_REGISTERED_USERS);
      const registered: UserProfile[] = storedUsers ? JSON.parse(storedUsers) : [];
      const match = registered.find((u) => u.email.toLowerCase() === email.toLowerCase());

      if (match) {
        const updatedMatch: UserProfile = {
          ...match,
          authProvider: 'google'
        };
        setUser(updatedMatch);
        setIsLoading(false);
        return;
      }

      // Create new registered Google user
      const newGoogleUser: UserProfile = {
        id: `usr-google-${Date.now()}`,
        name,
        email,
        avatarUrl,
        bio: 'Patron of acoustic gatherings, contemporary craftsmanship, and architectural salons.',
        city: 'Nairobi & Avignon',
        joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        role: 'patron',
        authProvider: 'google',
        googleId: `google-sub-${Date.now()}`
      };

      localStorage.setItem(STORAGE_REGISTERED_USERS, JSON.stringify([newGoogleUser, ...registered]));
      setUser(newGoogleUser);
      setIsLoading(false);
    } catch (e) {
      console.warn('Error during Google authentication', e);
      setIsLoading(false);
      throw new Error('Google authentication service encountered a transient issue. Please try again.');
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!email || !email.includes('@')) {
      setIsLoading(false);
      throw new Error('Please enter a valid email address.');
    }

    setIsLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 450));

    setUser((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...updates
      };
    });

    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        resetPassword,
        updateProfile,
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
