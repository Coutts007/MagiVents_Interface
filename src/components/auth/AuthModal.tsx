import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Loader2
} from 'lucide-react';
import { AuthModalMode } from '../../types/auth';
import { useAuth } from '../../context/AuthContext';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: AuthModalMode;
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const { login, signup, loginWithGoogle, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessNotice(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await login(email, password);
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to authenticate. Please check your credentials.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    try {
      await signup(name, email, password);
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create your account.');
    }
  };

  const handleGoogleAuth = async (credential: string) => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle(credential);
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication was not completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    try {
      await resetPassword(email);
      setSuccessNotice(`If an account exists for ${email}, we have sent a link to reset your password. Check your inbox and spam folder.`);
      setMode('reset-sent');
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not initiate reset. Please check your email.');
    }
  };

  // Password Strength indicator calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-amber-400' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-emerald-500' };
    return { score: 3, label: 'Strong', color: 'bg-[#8A4F33]' };
  };

  const strength = getPasswordStrength(password);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      maxWidth="md"
      title={
        mode === 'login'
          ? 'Welcome to MagiVents'
          : mode === 'signup'
          ? 'Create your account'
          : 'Reset your password'
      }
      subtitle={
        mode === 'login'
          ? 'Sign in to see your tickets, saved events and the events you organize.'
          : mode === 'signup'
          ? 'Create a free account to book tickets, save events and publish your own.'
          : 'Enter the email you registered with and we will send you a reset link.'
      }
    >
      <div className="space-y-6">
        {/* Mode Selector Tabs (Login / Signup) */}
        {mode !== 'forgot-password' && mode !== 'reset-sent' && (
          <div className="flex bg-[#E9E2D6] p-1 rounded-2xl border border-[#D8CDBC]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold'
                  : 'text-[#675A50] hover:text-[#1E1814]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-ivory text-[#1E1814] shadow-sand-sm font-semibold'
                  : 'text-[#675A50] hover:text-[#1E1814]'
              }`}
            >
              Create account
            </button>
          </div>
        )}

        {/* Error State Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* 1. Login Form */}
        {mode === 'login' && (
          <div className="space-y-4">
            {/* Google Authentication Option */}
            <div className="relative">
              <GoogleSignInButton text="signin_with" onCredential={handleGoogleAuth} onError={setErrorMessage} />
              {isGoogleLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#EFE8DD]/70 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8A4F33]" />
                </div>
              )}
            </div>

            {/* Aesthetic Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#D8CDBC]" />
              </div>
              <div className="relative bg-[#EFE8DD] px-3 text-[10px] uppercase tracking-wider text-[#675A50] font-medium rounded-full">
                or sign in with password
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-[#8A4F33] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full pl-10 pr-10 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#675A50] hover:text-[#1E1814] p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                type="submit"
                disabled={isLoading}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Signup Form */}
      {mode === 'signup' && (
        <div className="space-y-4">
          {/* Google Registration Option */}
          <div className="relative">
            <GoogleSignInButton text="signup_with" onCredential={handleGoogleAuth} onError={setErrorMessage} />
            {isGoogleLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#EFE8DD]/70 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-[#8A4F33]" />
              </div>
            )}
          </div>

          {/* Aesthetic Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#D8CDBC]" />
            </div>
            <div className="relative bg-[#EFE8DD] px-3 text-[10px] uppercase tracking-wider text-[#675A50] font-medium rounded-full">
              or sign up with email
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Full name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your first and last name"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Password (at least 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mix letters, numbers and symbols"
                  className="w-full pl-10 pr-10 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#675A50] hover:text-[#1E1814] p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full bg-[#D8CDBC] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.score >= 1 ? strength.color : 'bg-transparent'
                      } ${strength.score === 1 ? 'w-1/3' : strength.score === 2 ? 'w-2/3' : 'w-full'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#675A50]">
                    <span>Password strength:</span>
                    <span className="font-semibold text-[#1E1814]">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Type the password again"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>
            </div>

            <p className="text-xs text-[#675A50] leading-relaxed pt-1">
              By creating an account you agree to use MagiVents responsibly. Questions? Email magiventskenya@gmail.com.
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                type="submit"
                disabled={isLoading}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              >
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Forgot Password Form */}
        {mode === 'forgot-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Button
                variant="primary"
                fullWidth
                size="lg"
                type="submit"
                disabled={isLoading}
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
              >
                {isLoading ? 'Sending...' : 'Send reset link'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-xs text-[#675A50] hover:text-[#1E1814] text-center cursor-pointer py-1"
              >
                ← Back to sign in
              </button>
            </div>
          </form>
        )}

        {/* 4. Reset Sent State */}
        {mode === 'reset-sent' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h4 className="font-serif text-xl font-medium text-[#1E1814]">
              Check your email
            </h4>
            <p className="text-sm text-[#675A50] leading-relaxed max-w-sm mx-auto">
              {successNotice || 'Open the link in the email to choose a new password.'}
            </p>
            <div className="pt-2">
              <Button
                variant="primary"
                fullWidth
                onClick={() => {
                  setMode('login');
                  setSuccessNotice(null);
                }}
              >
                Back to sign in
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
