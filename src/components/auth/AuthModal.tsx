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
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

<<<<<<< HEAD
// Official Multi-Color Google G Icon
const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

=======
>>>>>>> eecc011 (Save local partial code before merging)
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
<<<<<<< HEAD
  const { login, signup, loginWithGoogle, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [showCustomGooglePrompt, setShowCustomGooglePrompt] = useState(false);
=======
  const { login, signup, resetPassword, isLoading } = useAuth();

  const [mode, setMode] = useState<AuthModalMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
>>>>>>> eecc011 (Save local partial code before merging)

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

<<<<<<< HEAD
  const handleGoogleAuth = async (customEmail?: string) => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const emailToUse = customEmail || customGoogleEmail.trim() || 'petershemaya007@gmail.com';
      const nameToUse = emailToUse.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      await loginWithGoogle({
        email: emailToUse,
        name: nameToUse,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
      });
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google authentication was not completed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

=======
>>>>>>> eecc011 (Save local partial code before merging)
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
<<<<<<< HEAD
          <div className="space-y-4">
            {/* Google Authentication Option */}
            <div>
              <button
                type="button"
                onClick={() => handleGoogleAuth()}
                disabled={isLoading || isGoogleLoading}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F5] border border-[#E2DDD5] hover:border-[#736B66] rounded-xl text-xs font-semibold text-[#2A2421] flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C85A40]" />
                ) : (
                  <GoogleIcon className="w-4 h-4 shrink-0" />
                )}
                <span>Sign In with Google Account</span>
              </button>
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
=======
          <form onSubmit={handleLogin} className="space-y-4">
>>>>>>> eecc011 (Save local partial code before merging)
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
<<<<<<< HEAD
        </div>
      )}

      {/* 2. Signup Form */}
      {mode === 'signup' && (
        <div className="space-y-4">
          {/* Google Registration Option */}
          <div>
            <button
              type="button"
              onClick={() => handleGoogleAuth()}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF8F5] border border-[#E2DDD5] hover:border-[#736B66] rounded-xl text-xs font-semibold text-[#2A2421] flex items-center justify-center gap-2.5 transition-all shadow-xs cursor-pointer active:scale-98 disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#C85A40]" />
              ) : (
                <GoogleIcon className="w-4 h-4 shrink-0" />
              )}
              <span>Complete Registration with Google</span>
            </button>

            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => setShowCustomGooglePrompt(!showCustomGooglePrompt)}
                className="text-[11px] text-[#736B66] hover:text-[#C85A40] underline cursor-pointer"
              >
                {showCustomGooglePrompt ? 'Hide specific Google address' : 'Specify a custom Google account'}
              </button>
            </div>

            {showCustomGooglePrompt && (
              <div className="mt-2 p-3 bg-[#FAF8F5] border border-[#E2DDD5] rounded-xl flex gap-2 animate-in fade-in">
                <input
                  type="email"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  placeholder="your-google-name@gmail.com"
                  className="flex-1 px-3 py-1.5 bg-white border border-[#E2DDD5] rounded-lg text-xs text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleAuth(customGoogleEmail)}
                  disabled={isGoogleLoading || !customGoogleEmail.includes('@')}
                  className="px-3 py-1.5 bg-[#2A2421] text-white rounded-lg text-xs font-semibold hover:bg-[#C85A40] transition-colors cursor-pointer disabled:opacity-50"
                >
                  Register
                </button>
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

=======
        )}

        {/* 2. Signup Form */}
        {mode === 'signup' && (
>>>>>>> eecc011 (Save local partial code before merging)
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
<<<<<<< HEAD
        </div>
      )}

      {/* 3. Forgot Password Form */}
=======
        )}

        {/* 3. Forgot Password Form */}
>>>>>>> eecc011 (Save local partial code before merging)
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
