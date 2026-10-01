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
  const [rememberMe, setRememberMe] = useState(true);

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
      setSuccessNotice(`A password recovery dispatch has been issued to ${email}. Follow the instructions to choose a new phrase.`);
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

    if (score <= 1) return { score: 1, label: 'Modest', color: 'bg-amber-400' };
    if (score <= 3) return { score: 2, label: 'Balanced', color: 'bg-emerald-500' };
    return { score: 3, label: 'Robust', color: 'bg-[#C85A40]' };
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
          ? 'Join the Curatorial Circle'
          : 'Reset Your Credentials'
      }
      subtitle={
        mode === 'login'
          ? 'Sign in to access your digital passes, saved salons, and invitations.'
          : mode === 'signup'
          ? 'Create a patron profile to reserve limited seating and save gatherings.'
          : 'Enter your email address to receive secure reset instructions.'
      }
    >
      <div className="space-y-6">
        {/* Mode Selector Tabs (Login / Signup) */}
        {mode !== 'forgot-password' && mode !== 'reset-sent' && (
          <div className="flex bg-[#F4F1EA] p-1 rounded-2xl border border-[#E2DDD5]">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#2A2421] shadow-sand-sm font-semibold'
                  : 'text-[#736B66] hover:text-[#2A2421]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#2A2421] shadow-sand-sm font-semibold'
                  : 'text-[#736B66] hover:text-[#2A2421]'
              }`}
            >
              New Patron Registration
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
                <div className="absolute inset-0 flex items-center justify-center bg-[#FAF8F5]/70 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-[#C85A40]" />
                </div>
              )}
            </div>

            {/* Aesthetic Divider */}
            <div className="relative my-3 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2DDD5]" />
              </div>
              <div className="relative bg-[#FAF8F5] px-3 text-[10px] uppercase tracking-wider text-[#736B66] font-medium rounded-full">
                or sign in with password
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40] focus:ring-1 focus:ring-[#C85A40]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot-password');
                    setErrorMessage(null);
                  }}
                  className="text-xs text-[#C85A40] hover:underline cursor-pointer"
                >
                  Forgot phrase?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40] focus:ring-1 focus:ring-[#C85A40]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#736B66] hover:text-[#2A2421] p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#736B66] pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-[#E2DDD5] text-[#C85A40] focus:ring-[#C85A40]"
                />
                <span>Remember me on this workstation</span>
              </label>
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
                {isLoading ? 'Verifying Patron...' : 'Enter MagiVents'}
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
              <div className="absolute inset-0 flex items-center justify-center bg-[#FAF8F5]/70 rounded-xl">
                <Loader2 className="w-4 h-4 animate-spin text-[#C85A40]" />
              </div>
            )}
          </div>

          {/* Aesthetic Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E2DDD5]" />
            </div>
            <div className="relative bg-[#FAF8F5] px-3 text-[10px] uppercase tracking-wider text-[#736B66] font-medium rounded-full">
              or register with password credentials
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alistair Finch"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alistair@finch.org"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Security Password (Min 8 Characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#736B66] hover:text-[#2A2421] p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength bar */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1.5 w-full bg-[#E2DDD5] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        strength.score >= 1 ? strength.color : 'bg-transparent'
                      } ${strength.score === 1 ? 'w-1/3' : strength.score === 2 ? 'w-2/3' : 'w-full'}`}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#736B66]">
                    <span>Password Strength:</span>
                    <span className="font-semibold text-[#2A2421]">{strength.label}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>
            </div>

            <p className="text-xs text-[#736B66] leading-relaxed pt-1">
              By registering, you honor the MagiVents Acoustic Code and respect limited-capacity salon bookings.
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
                {isLoading ? 'Creating Patron Account...' : 'Complete Registration'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Forgot Password Form */}
        {mode === 'forgot-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#736B66] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
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
                {isLoading ? 'Issuing Instructions...' : 'Send Recovery Dispatch'}
              </Button>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                }}
                className="text-xs text-[#736B66] hover:text-[#2A2421] text-center cursor-pointer py-1"
              >
                ← Return to Sign In
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
            <h4 className="font-serif text-xl font-medium text-[#2A2421]">
              Recovery Dispatch Sent
            </h4>
            <p className="text-sm text-[#736B66] leading-relaxed max-w-sm mx-auto">
              {successNotice || 'Please verify your inbox for the reset link to choose a new secure passphrase.'}
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
                Return to Sign In
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
