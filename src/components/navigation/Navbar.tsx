import React, { useState } from 'react';
import {
  Menu,
  X,
  Bookmark,
  PlusCircle,
  Compass,
  Calendar,
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Search
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { BrandLogo } from '../ui/BrandLogo';

export interface NavbarProps {
  currentView: 'discover' | 'details' | 'organizer' | 'profile';
  onNavigate: (view: 'discover' | 'details' | 'organizer' | 'profile', tab?: 'grid' | 'calendar') => void;
  savedCount: number;
  onOpenSaved: () => void;
  onCreateEvent: () => void;
  onOpenAuth: () => void;
  /** Opens the site-wide event search */
  onOpenSearch: () => void;
  discoverTab?: 'grid' | 'calendar';
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  savedCount,
  onOpenSaved,
  onCreateEvent,
  onOpenAuth,
  onOpenSearch,
  discoverTab = 'grid'
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    {
      label: 'Discover',
      view: 'discover' as const,
      tab: 'grid' as const,
      icon: Compass,
      active: currentView === 'discover' && discoverTab === 'grid'
    },
    {
      label: 'Calendar',
      view: 'discover' as const,
      tab: 'calendar' as const,
      icon: Calendar,
      active: currentView === 'discover' && discoverTab === 'calendar'
    },
    {
      label: 'Organizer Dashboard',
      view: 'organizer' as const,
      tab: 'grid' as const,
      icon: LayoutDashboard,
      active: currentView === 'organizer'
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#2B211C]/85 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('discover')}
            className="group text-left cursor-pointer rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C7B173]"
            aria-label="MagiVents Home"
          >
            <BrandLogo className="h-7 sm:h-9 transition-[filter] duration-300 group-hover:brightness-110" />
          </button>
        </div>

        {/* Zone 2: Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                onNavigate(item.view, item.tab);
              }}
              className={`relative py-2 text-sm font-medium tracking-wide transition-colors duration-300 cursor-pointer ${
                item.active ? 'text-[#F3E9DE]' : 'text-[#CDBFB2] hover:text-[#F3E9DE]'
              }`}
            >
              <span>{item.label}</span>
              {/* Subtle underline */}
              <span
                className={`absolute bottom-0 left-0 w-full h-[2px] bg-brand-gold transition-transform duration-300 origin-left ${
                  item.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100 hover:scale-x-100'
                }`}
              />
            </button>
          ))}
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Search: labelled field on wide screens, icon on small ones */}
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search events"
            title="Search events (press /)"
            className="hidden lg:flex items-center gap-2.5 w-56 xl:w-64 pl-4 pr-2 py-2 rounded-full border border-white/15 bg-white/5 text-left text-xs text-[#CDBFB2] hover:border-[#98613D] hover:text-[#F3E9DE] transition-colors cursor-pointer min-h-[44px]"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 truncate">Search events</span>
            <kbd className="text-[10px] font-medium border border-white/15 rounded-md px-1.5 py-0.5">/</kbd>
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Search events"
            className="lg:hidden p-2.5 rounded-full text-[#CDBFB2] hover:text-[#F3E9DE] hover:bg-white/10 transition-colors duration-300 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Bookmark Button */}
          <button
            onClick={onOpenSaved}
            aria-label={`View saved events, ${savedCount} saved`}
            className="relative p-2.5 rounded-full text-[#CDBFB2] hover:text-[#F3E9DE] hover:bg-white/10 transition-colors duration-300 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Bookmark className="w-5 h-5" />
            {savedCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-gold text-[#1E1814] text-[10px] font-bold flex items-center justify-center tabular-nums">
                {savedCount}
              </span>
            )}
          </button>

          {/* User Auth Profile Trigger */}
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 pl-2.5 pr-2 rounded-full border border-white/15 bg-white/5 hover:border-[#98613D] transition-colors cursor-pointer min-h-[44px]"
                aria-label="User profile menu"
              >
                <Avatar name={user.name} src={user.avatarUrl} size="sm" />
                <span className="hidden lg:inline text-xs font-medium text-[#F3E9DE] max-w-[120px] truncate">
                  {user.name.split(' ')[0]}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#CDBFB2]" />
              </button>

              {/* User Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="absolute right-0 mt-2 w-56 bg-ivory rounded-2xl border border-[#D8CDBC] shadow-sand-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="px-4 py-2 border-b border-[#D8CDBC]">
                    <span className="text-xs font-semibold text-[#1E1814] block truncate">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-[#675A50] block truncate">
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
                        ? 'bg-[#E9E2D6] text-[#8A4F33]'
                        : 'text-[#1E1814] hover:bg-[#E9E2D6]/60'
                    }`}
                  >
                    <User className="w-4 h-4 text-[#8A4F33]" />
                    <span>My Profile & Tickets</span>
                  </button>

                  <button
                    onClick={() => {
                      onNavigate('organizer');
                      setUserDropdownOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-left font-medium text-[#1E1814] hover:bg-[#E9E2D6]/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#675A50]" />
                    <span>Organizer Dashboard</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-[#D8CDBC]">
                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-xs text-left font-medium text-red-700 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign out</span>
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
              Sign in
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
              Create event
            </Button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden p-2.5 rounded-full text-[#F3E9DE] hover:bg-white/10 transition-colors duration-300 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="h-[2px] bg-brand-gold opacity-80" />

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#D8CDBC] bg-[#E9E2D6] px-6 py-6 shadow-sand-lg animate-in slide-in-from-top-4 duration-300">
          <nav className="flex flex-col gap-2">
            {isAuthenticated && user && (
              <button
                onClick={() => {
                  onNavigate('profile');
                  setMobileMenuOpen(false);
                }}
                className={`min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-base font-medium transition-colors text-left cursor-pointer ${
                  currentView === 'profile'
                    ? 'bg-ivory text-[#8A4F33] shadow-sand-sm font-semibold'
                    : 'text-[#1E1814] hover:bg-ivory/60'
                }`}
              >
                <Avatar name={user.name} src={user.avatarUrl} size="xs" />
                <span>My Profile & Tickets</span>
              </button>
            )}

            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  onNavigate(item.view, item.tab);
                  setMobileMenuOpen(false);
                }}
                className={`min-h-[48px] px-4 rounded-xl flex items-center gap-3 text-base font-medium transition-colors text-left cursor-pointer ${
                  item.active
                    ? 'bg-ivory text-[#8A4F33] shadow-sand-sm font-semibold'
                    : 'text-[#1E1814] hover:bg-ivory/60'
                }`}
              >
                <item.icon className="w-5 h-5 text-[#675A50]" />
                <span>{item.label}</span>
              </button>
            ))}

            <div className="pt-4 mt-2 border-t border-[#D8CDBC] flex flex-col gap-3">
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
                  Sign in / Create account
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
                  Sign out
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
                Create event
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
