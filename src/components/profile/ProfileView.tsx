import React, { useState } from 'react';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  Ticket,
  Bookmark,
  Shield,
  Edit3,
  LogOut,
  QrCode,
  CalendarPlus,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Camera,
  Layers,
  Sparkles,
  Share2,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EventItem, TicketBooking } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export interface ProfileViewProps {
  onNavigate: (view: 'discover' | 'organizer') => void;
  onSelectEvent: (event: EventItem) => void;
  savedEvents: EventItem[];
  purchasedBookings: TicketBooking[];
  onRemoveBookmark: (eventId: string) => void;
  onShareEvent?: (event: EventItem) => void;
  allEvents?: EventItem[];
}

const AVATAR_PRESETS = [
  { label: 'Studio Portrait I', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Studio Portrait II', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Studio Portrait III', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Studio Portrait IV', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80' }
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigate,
  onSelectEvent,
  savedEvents,
  purchasedBookings,
  onRemoveBookmark,
  onShareEvent,
  allEvents = []
}) => {
  const { user, updateProfile, logout, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'passes' | 'saved' | 'security'>('passes');

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || AVATAR_PRESETS[0].url);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Digital Pass Inspection Modal
  const [selectedPass, setSelectedPass] = useState<TicketBooking | null>(null);
  const [passCalendarAdded, setPassCalendarAdded] = useState(false);

  // Security Password Change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-white border border-[#E2DDD5] flex items-center justify-center text-[#C85A40] mb-4 shadow-sand-sm">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-medium text-[#2A2421] mb-2">
          Patron Profile
        </h2>
        <p className="text-sm text-[#736B66] max-w-md mx-auto mb-6">
          Sign in or register an account to access your digital passes, review saved salons, and update your curatorial preferences.
        </p>
        <Button variant="primary" onClick={() => onNavigate('discover')}>
          Explore MagiVents Directory
        </Button>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditBio(user.bio || '');
    setEditCity(user.city || '');
    setEditAvatarUrl(user.avatarUrl);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editName.trim()) {
      setEditError('Name cannot be empty.');
      return;
    }
    if (!editEmail.includes('@')) {
      setEditError('Please provide a valid email address.');
      return;
    }

    try {
      const finalAvatar = customAvatarInput.trim() || editAvatarUrl;
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        bio: editBio.trim(),
        city: editCity.trim(),
        avatarUrl: finalAvatar
      });
      setEditSuccess(true);
      setTimeout(() => {
        setEditSuccess(false);
        setIsEditModalOpen(false);
      }, 600);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(null);

    if (!currentPass) {
      setSecurityError('Please enter your current password.');
      return;
    }
    if (newPass.length < 8) {
      setSecurityError('New password must be at least 8 characters.');
      return;
    }
    if (newPass !== confirmNewPass) {
      setSecurityError('New passwords do not match.');
      return;
    }

    setSecuritySuccess('Security credentials updated successfully.');
    setCurrentPass('');
    setNewPass('');
    setConfirmNewPass('');
    setTimeout(() => setSecuritySuccess(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 animate-in fade-in duration-500">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DDD5] shadow-sand-sm mb-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group shrink-0">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-24 h-24 sm:w-28 sm:sm:h-28 rounded-full object-cover border-2 border-[#E2DDD5] shadow-sand-sm"
              />
              <button
                onClick={handleOpenEdit}
                aria-label="Change portrait"
                className="absolute inset-0 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#2A2421]">
                  {user.name}
                </h1>
                <Badge variant="terracotta" size="sm">
                  {user.role === 'curator' ? 'Host & Curator' : 'Patron of the Arts'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#736B66]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#C85A40]" />
                  {user.email}
                </span>
                {user.city && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#736B66]" />
                      {user.city}
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#736B66]" />
                  Member since {user.joinedDate}
                </span>
              </div>

              {user.bio && (
                <p className="text-sm text-[#736B66] max-w-xl leading-relaxed pt-1">
                  "{user.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#E2DDD5]">
            <Button
              variant="secondary"
              size="md"
              icon={<Edit3 className="w-4 h-4" />}
              onClick={handleOpenEdit}
            >
              Edit Profile
            </Button>
            <Button
              variant="ghost"
              size="md"
              icon={<LogOut className="w-4 h-4" />}
              onClick={logout}
              title="Sign out of current workstation"
            >
              Sign Out
            </Button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="mt-8 pt-6 border-t border-[#E2DDD5] grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F4F1EA]/60 border border-[#E2DDD5]/70">
            <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
              Purchased Passes
            </span>
            <span className="font-serif text-2xl font-bold text-[#2A2421] tabular-nums mt-1 block">
              {purchasedBookings.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F1EA]/60 border border-[#E2DDD5]/70">
            <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
              Saved Gatherings
            </span>
            <span className="font-serif text-2xl font-bold text-[#2A2421] tabular-nums mt-1 block">
              {savedEvents.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F1EA]/60 border border-[#E2DDD5]/70 col-span-2 sm:col-span-1">
            <span className="text-xs uppercase tracking-wider text-[#736B66] font-semibold block">
              Patron Standing
            </span>
            <span className="text-xs font-medium text-emerald-800 flex items-center gap-1.5 mt-2">
              <Sparkles className="w-3.5 h-3.5 text-[#C85A40]" />
              Verified & In Good Standing
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#E2DDD5] flex gap-8 mb-8">
        <button
          onClick={() => setActiveTab('passes')}
          className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
            activeTab === 'passes' ? 'text-[#2A2421]' : 'text-[#736B66] hover:text-[#2A2421]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#C85A40]" />
            Purchased Passes ({purchasedBookings.length})
          </span>
          {activeTab === 'passes' && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C85A40]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
            activeTab === 'saved' ? 'text-[#2A2421]' : 'text-[#736B66] hover:text-[#2A2421]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#C85A40]" />
            Favorited Gatherings ({savedEvents.length})
          </span>
          {activeTab === 'saved' && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C85A40]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
            activeTab === 'security' ? 'text-[#2A2421]' : 'text-[#736B66] hover:text-[#2A2421]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#C85A40]" />
            Security & Preferences
          </span>
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#C85A40]" />
          )}
        </button>
      </div>

      {/* TAB 1: Purchased Passes */}
      {activeTab === 'passes' && (
        <div className="space-y-6">
          {purchasedBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {purchasedBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-3xl p-6 border border-[#E2DDD5] shadow-sand-sm hover:border-[#C85A40] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#C85A40] bg-[#C85A40]/10 px-2.5 py-1 rounded-full">
                        {booking.ticketCode}
                      </span>
                      <span className="text-xs text-[#736B66]">
                        Reserved {booking.bookingDate}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-medium text-[#2A2421] line-clamp-1">
                      {booking.eventTitle}
                    </h3>

                    <div className="text-xs text-[#736B66] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C85A40]" />
                        <span>{booking.eventDate} · {booking.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#736B66]" />
                        <span className="truncate">{booking.venueName}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#F4F1EA] rounded-xl flex items-center justify-between text-xs text-[#2A2421]">
                      <span>
                        {booking.tierName} × {booking.quantity}
                      </span>
                      <span className="font-serif font-bold tabular-nums">
                        ${booking.totalPrice} Paid
                      </span>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-[#E2DDD5] flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#736B66]">
                      <QrCode className="w-4 h-4 text-[#2A2421]" />
                      <span>Ready for scan</span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedPass(booking)}
                    >
                      View Digital Pass
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2DDD5] shadow-sand-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#C85A40] mb-4">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[#2A2421] mb-2">
                No active passes yet
              </h3>
              <p className="text-sm text-[#736B66] max-w-md mx-auto mb-6">
                When you reserve seating for chamber recitals, vineyard dinners, or architecture symposiums, your authenticated digital passes will reside here.
              </p>
              <Button variant="primary" onClick={() => onNavigate('discover')}>
                Browse Upcoming Gatherings
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Favorited Gatherings */}
      {activeTab === 'saved' && (
        <div>
          {savedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-3xl p-4 border border-[#E2DDD5] hover:border-[#C85A40] transition-all shadow-sand-sm flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <Badge variant="neutral" size="sm">
                          {event.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#736B66] mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C85A40]" />
                      <span>{event.date}</span>
                    </div>

                    <h4 className="font-serif text-lg font-medium text-[#2A2421] line-clamp-1 mb-2">
                      {event.title}
                    </h4>

                    <p className="text-xs text-[#736B66] line-clamp-2 leading-relaxed mb-4">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#E2DDD5] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#2A2421] tabular-nums">
                      from ${event.pricing.startingPrice}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onShareEvent && (
                        <button
                          type="button"
                          onClick={() => onShareEvent(event)}
                          title="Share gathering"
                          className="p-1.5 text-[#736B66] hover:text-[#C85A40] hover:bg-[#F4F1EA] rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveBookmark(event.id)}
                        className="text-xs text-[#736B66] hover:text-red-700 px-2 py-1 cursor-pointer"
                      >
                        Remove
                      </button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSelectEvent(event)}
                        icon={<ArrowRight className="w-3.5 h-3.5" />}
                        iconPosition="right"
                      >
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E2DDD5] shadow-sand-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#F4F1EA] flex items-center justify-center text-[#736B66] mb-4">
                <Bookmark className="w-8 h-8 text-[#C85A40]" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[#2A2421] mb-2">
                No favorited gatherings
              </h3>
              <p className="text-sm text-[#736B66] max-w-md mx-auto mb-6">
                Explore our curated catalog and click the bookmark icon on any edition to save it for consideration.
              </p>
              <Button variant="primary" onClick={() => onNavigate('discover')}>
                Discover Gatherings
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Security & Preferences */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-white rounded-3xl p-6 sm:p-10 border border-[#E2DDD5] shadow-sand-sm space-y-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#C85A40] font-bold block mb-1">
              Authentication Credentials
            </span>
            <h3 className="font-serif text-2xl font-medium text-[#2A2421]">
              Change Passphrase
            </h3>
            <p className="text-xs text-[#736B66] mt-1">
              Ensure your account employs a strong, distinctive phrase.
            </p>
          </div>

          {securitySuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{securitySuccess}</span>
            </div>
          )}

          {securityError && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{securityError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  New Passphrase (Min 8 Chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                  Confirm New Passphrase
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" type="submit">
                Update Passphrase
              </Button>
            </div>
          </form>

          {/* Email Notification Toggles */}
          <div className="pt-6 border-t border-[#E2DDD5] space-y-4">
            <h4 className="font-serif text-lg font-medium text-[#2A2421]">
              Curatorial Dispatches
            </h4>
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 rounded border-[#E2DDD5] text-[#C85A40] focus:ring-[#C85A40]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#2A2421] block">
                    Private Salon Early Invitations
                  </span>
                  <span className="text-xs text-[#736B66]">
                    Receive 24-hour advance booking notices prior to public release.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="mt-0.5 rounded border-[#E2DDD5] text-[#C85A40] focus:ring-[#C85A40]"
                />
                <div>
                  <span className="text-xs font-semibold text-[#2A2421] block">
                    Day-of-Event Acoustic & Directions Briefing
                  </span>
                  <span className="text-xs text-[#736B66]">
                    Arrival protocol and gate codes dispatched the morning of attendance.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Patron Information"
        subtitle="Update your identity credentials and portrait."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {editError && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800">
              {editError}
            </div>
          )}
          {editSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              ✓ Information saved successfully.
            </div>
          )}

          {/* Avatar Preset Selector */}
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-2">
              Select Editorial Portrait
            </label>
            <div className="grid grid-cols-4 gap-3 mb-3">
              {AVATAR_PRESETS.map((preset) => (
                <div
                  key={preset.label}
                  onClick={() => {
                    setEditAvatarUrl(preset.url);
                    setCustomAvatarInput('');
                  }}
                  className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                    editAvatarUrl === preset.url && !customAvatarInput
                      ? 'border-[#C85A40] ring-2 ring-[#C85A40]/30 scale-105'
                      : 'border-[#E2DDD5] hover:border-[#736B66]'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <input
              type="url"
              value={customAvatarInput}
              onChange={(e) => setCustomAvatarInput(e.target.value)}
              placeholder="Or paste custom image URL..."
              className="w-full px-4 py-2 bg-white border border-[#E2DDD5] rounded-xl text-xs text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Full Legal Name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="Avignon & Provence"
                className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Curatorial Bio & Artistic Interests
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Share your resonance with acoustic gatherings, natural gastronomy, or design..."
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div className="pt-4 border-t border-[#E2DDD5] flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={authLoading}>
              {authLoading ? 'Saving Changes...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital Pass Inspector Modal */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          title="Digital Admission Voucher"
          subtitle="Present this voucher upon entry."
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="bg-[#FAF8F5] border-2 border-[#E2DDD5] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="flex justify-between items-start pb-4 border-b border-dashed border-[#E2DDD5]">
                <div>
                  <span className="font-serif text-xl font-bold text-[#2A2421]">
                    MagiVents Admission
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-[#736B66] block">
                    Official Guest Pass
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#C85A40] bg-[#C85A40]/10 px-2.5 py-1 rounded-full">
                  {selectedPass.ticketCode}
                </span>
              </div>

              <div className="py-4 space-y-2">
                <h3 className="font-serif text-xl font-medium text-[#2A2421]">
                  {selectedPass.eventTitle}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-[#736B66] pt-1">
                  <div>
                    <span className="font-semibold text-[#2A2421] block">Guest</span>
                    <span>{selectedPass.attendeeName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#2A2421] block">Tier</span>
                    <span>{selectedPass.tierName} ({selectedPass.quantity} Guests)</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#2A2421] block">Date</span>
                    <span>{selectedPass.eventDate} · {selectedPass.eventTime}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#2A2421] block">Location</span>
                    <span className="truncate block">{selectedPass.venueName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-[#E2DDD5] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl border border-[#E2DDD5] flex items-center justify-center text-[#2A2421]">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="text-[11px] text-[#736B66]">
                    <span>Scan at reception</span>
                    <span className="block font-medium text-[#2A2421]">
                      Issued {selectedPass.bookingDate}
                    </span>
                  </div>
                </div>
                <span className="font-serif text-lg font-bold text-[#2A2421] tabular-nums">
                  ${selectedPass.totalPrice} Paid
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="secondary"
                fullWidth
                icon={passCalendarAdded ? <Check className="w-4 h-4 text-emerald-600" /> : <CalendarPlus className="w-4 h-4" />}
                onClick={() => {
                  setPassCalendarAdded(true);
                  setTimeout(() => setPassCalendarAdded(false), 3000);
                }}
              >
                {passCalendarAdded ? 'Added (.ics)' : 'Add to Calendar'}
              </Button>

              {onShareEvent && (
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Share2 className="w-4 h-4 text-[#C85A40]" />}
                  onClick={() => {
                    const matchedEvent = allEvents.find((e) => e.id === selectedPass.eventId) ||
                      savedEvents.find((e) => e.id === selectedPass.eventId);
                    if (matchedEvent) {
                      onShareEvent(matchedEvent);
                    }
                  }}
                >
                  Invite Companions
                </Button>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={() => setSelectedPass(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
