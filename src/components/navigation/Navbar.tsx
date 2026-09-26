import React, { useState } from 'react';
import {
  Menu,
  X,
  Bookmark,
  PlusCircle,
  Compass,
  Calendar,
  Building,
  Sparkles,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export interface NavbarProps {
  currentView: 'discover' | 'details' | 'organizer' | 'profile';
  onNavigate: (view: 'discover' | 'details' | 'organizer' | 'profile') => void;
  savedCount: number;
  onOpenSaved: () => void;
  onCreateEvent: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  savedCount,
  onOpenSaved,
  onCreateEvent,
  onOpenAuth
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    {
      label: 'Discover',
      view: 'discover' as const,
      icon: Compass,
      active: currentView === 'discover'
    },
    {
      label: 'Curated Series',
      view: 'discover' as const,
      icon: Sparkles,
      active: false
    },
    {
      label: 'Venues',
      view: 'discover' as const,
      icon: Building,
      active: false
    },
    {
      label: 'Organizer Portal',
      view: 'organizer' as const,
      icon: Calendar,
      active: currentView === 'organizer'
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F4F1EA]/85 border-b border-[#E2DDD5] transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('discover')}
            className="group text-left cursor-pointer focus-visible:outline-none"
            aria-label="MagiVents Home"
          >
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#2A2421] group-hover:text-[#C85A40] transition-colors duration-300">
              MagiVents
            </span>
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onNavigate(item.view);
              }}
              className={`relative py-2 text-sm font-medium tracking-wide transition-colors duration-300 cursor-pointer ${
                item.active ? 'text-[#2A2421]' : 'text-[#736B66] hover:text-[#2A2421]'
              }`}
            >
              <span>{item.label}</span>
              {/* Subtle underline */}
              <span
                className={`absolute bottom-0 left-0 w-full h-[2px] bg-[#C85A40] transition-transform duration-300 origin-left ${
                  item.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 hover:scale-x-100'
                }`}
              />
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Bookmark Button */}
          <button
            onClick={onOpenSaved}
            aria-label={`View saved events, ${savedCount} saved`}
            className="relative p-2.5 rounded-full text-[#736B66] hover:text-[#2A2421] hover:bg-[#E2DDD5]/50 transition-colors duration-300 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Bookmark className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#C85A40] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {savedCount}
              </span>
            )}
          </button>

          {/* User Auth Profile Trigger */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-full border border-[#E2DDD5] bg-white hover:border-[#736B66] transition-colors cursor-pointer shadow-xs min-h-[44px]"
                aria-label="User profile menu"
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-[#E2DDD5]"
                />
                <span className="hidden lg:inline text-xs font-medium text-[#2A2421] max-w-[120px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#736B66]" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#E2DDD5] shadow-sand-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="px-4 py-2 border-b border-[#E2DDD5]">
                    <span className="text-xs font-semibold text-[#2A2421] block truncate">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-[#736B66] block truncate">
                      {user.email}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      onNavigate('profile');
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-2.5 text-xs text-left font-medium transition-colors flex items-center gap-2 cursor-pointer ${
                      currentView === 'profile'
                        ? 'bg-[#F4F1EA] text-[#C85A40]'
                        : 'text-[#2A2421] hover:bg-[#F4F1EA]/60'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#C85A40]" />
                    <span>My Profile & Passes</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('organizer');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-left font-medium text-[#2A2421] hover:bg-[#F4F1EA]/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#736B66]" />
                    <span>Organizer Portal</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-[#E2DDD5]">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-xs text-left font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="secondary"
              size="md"
              icon={<User className="w-4 h-4" />}
              onClick={onOpenAuth}
            >
              Sign In
            </Button>
          )}

          {/* Create Event CTA */}
          <div className="hidden sm:block">
            <Button
              variant="primary"
              size="md"
              icon={<PlusCircle className="w-4 h-4" />}
              onClick={onCreateEvent}
            >
              Host Gathering
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2.5 rounded-full text-[#2A2421] hover:bg-[#E2DDD5]/60 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2DDD5] bg-[#F4F1EA] px-6 py-6 shadow-sand-lg animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-2">
            {isAuthenticated && user && (
              <button
                onClick={() => {
                  onNavigate('profile');
                  setMobileMenuOpen(false);
                }}
                className={`min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-base font-medium transition-colors text-left cursor-pointer ${
                  currentView === 'profile'
                    ? 'bg-white text-[#C85A40] shadow-sand-sm font-semibold'
                    : 'text-[#2A2421] hover:bg-white/60'
                }`}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-6 h-6 rounded-full object-cover border border-[#E2DDD5]"
                />
                <span>My Profile & Passes</span>
              </button>
            )}

            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.view);
                  setMobileMenuOpen(false);
                }}
                className={`min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-base font-medium transition-colors text-left cursor-pointer ${
                  item.active
                    ? 'bg-white text-[#C85A40] shadow-sand-sm font-semibold'
                    : 'text-[#2A2421] hover:bg-white/60'
                }`}
              >
                <item.icon className="w-5 h-5 text-[#736B66]" />
                <span>{item.label}</span>
              </button>
            ))}

            <div className="pt-4 mt-2 border-t border-[#E2DDD5] flex flex-col gap-3">
              {!isAuthenticated ? (
                <Button
                  variant="secondary"
                  fullWidth
                  size="lg"
                  icon={<User className="w-5 h-5" />}
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In / Register
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  fullWidth
                  size="md"
                  icon={<LogOut className="w-4 h-4 text-red-600" />}
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-red-700"
                >
                  Sign Out
                </Button>
              )}

              <Button
                variant="primary"
                fullWidth
                size="lg"
                icon={<PlusCircle className="w-5 h-5" />}
                onClick={() => {
                  onCreateEvent();
                  setMobileMenuOpen(false);
                }}
              >
                Host a Gathering
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
