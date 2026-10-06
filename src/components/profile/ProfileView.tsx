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
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Camera,
  Share2,
  Trash2,
  Printer,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { EventItem, TicketBooking } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { ImageUploadZone } from '../ui/ImageUploadZone';
import { Avatar } from '../ui/Avatar';
import { EventArtwork } from '../ui/EventArtwork';
import { formatKES } from '../../utils/format';
import { PrintableTicketModal } from '../ticket/PrintableTicketModal';
import { EmailConfirmationModal } from '../ticket/EmailConfirmationModal';

export interface ProfileViewProps {
  onNavigate: (view: 'discover' | 'organizer') => void;
  onSelectEvent: (event: EventItem) => void;
  savedEvents: EventItem[];
  purchasedBookings: TicketBooking[];
  onRemoveBookmark: (eventId: string) => void;
  onShareEvent?: (event: EventItem) => void;
  allEvents?: EventItem[];
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onNavigate,
  onSelectEvent,
  savedEvents,
  purchasedBookings,
  onRemoveBookmark,
  onShareEvent,
  allEvents = []
}) => {
  const { user, updateProfile, changePassword, logout, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'passes' | 'saved' | 'security'>('passes');

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editCity, setEditCity] = useState(user?.city || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  // Digital Pass Inspection Modal
  const [selectedPass, setSelectedPass] = useState<TicketBooking | null>(null);
  const [printBooking, setPrintBooking] = useState<TicketBooking | null>(null);
  const [emailBooking, setEmailBooking] = useState<TicketBooking | null>(null);

  // Security Password Change
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState<string | null>(null);
  const [securityError, setSecurityError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center animate-in fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-ivory border border-[#D8CDBC] flex items-center justify-center text-[#8A4F33] mb-4 shadow-sand-sm">
          <User className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl font-medium text-[#1E1814] mb-2">
          Your profile
        </h2>
        <p className="text-sm text-[#675A50] max-w-md mx-auto mb-6">
          Sign in or create an account to see your tickets, saved events and profile details.
        </p>
        <Button variant="primary" onClick={() => onNavigate('discover')}>
          Browse events
        </Button>
      </div>
    );
  }

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditBio(user.bio || '');
    setEditCity(user.city || '');
    setEditAvatarUrl(user.avatarUrl || '');
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
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        bio: editBio.trim(),
        city: editCity.trim(),
        // An empty string removes the photo; initials are shown instead
        avatarUrl: editAvatarUrl
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

  const handleChangePassword = async (e: React.FormEvent) => {
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

    try {
      await changePassword(currentPass, newPass);
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : 'Failed to update password.');
      return;
    }

    setSecuritySuccess('Your password has been updated.');
    setCurrentPass('');
    setNewPass('');
    setConfirmNewPass('');
    setTimeout(() => setSecuritySuccess(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-28 animate-in fade-in duration-500">
      {/* Profile Header Card */}
      <div className="bg-ivory rounded-3xl p-6 sm:p-10 border border-[#D8CDBC] shadow-sand-sm mb-10 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Avatar & Basic Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group shrink-0">
              <Avatar
                name={user.name}
                src={user.avatarUrl}
                size="xl"
                className="sm:w-28 sm:h-28 border-2 border-[#D8CDBC] shadow-sand-sm"
              />
              <button
                onClick={handleOpenEdit}
                aria-label={user.avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
                className="absolute inset-0 rounded-full bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-center p-2"
                title={user.avatarUrl ? 'Change profile photo' : 'Upload profile photo'}
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold leading-tight">
                  {user.avatarUrl ? 'Change photo' : 'Add photo'}
                </span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1E1814]">
                  {user.name}
                </h1>
                <Badge variant="terracotta" size="sm">
                  {user.role === 'curator' ? 'Organizer' : 'Attendee'}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#675A50]">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#8A4F33]" />
                  {user.email}
                </span>
                {user.city && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#675A50]" />
                      {user.city}
                    </span>
                  </>
                )}
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#675A50]" />
                  Member since {user.joinedDate}
                </span>
              </div>

              {user.bio && (
                <p className="text-sm text-[#675A50] max-w-xl leading-relaxed pt-1">
                  "{user.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0 border-[#D8CDBC]">
            <Button
              variant="secondary"
              size="md"
              icon={<Edit3 className="w-4 h-4" />}
              onClick={handleOpenEdit}
            >
              Edit profile
            </Button>
            <Button
              variant="ghost"
              size="md"
              icon={<LogOut className="w-4 h-4" />}
              onClick={logout}
              title="Sign out"
            >
              Sign out
            </Button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="mt-8 pt-6 border-t border-[#D8CDBC] grid grid-cols-2 gap-4 max-w-md">
          <div className="p-4 rounded-2xl bg-[#E9E2D6]/60 border border-[#D8CDBC]/70">
            <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
              Tickets booked
            </span>
            <span className="font-serif text-2xl font-bold text-[#1E1814] tabular-nums mt-1 block">
              {purchasedBookings.length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#E9E2D6]/60 border border-[#D8CDBC]/70">
            <span className="text-xs uppercase tracking-wider text-[#675A50] font-semibold block">
              Saved events
            </span>
            <span className="font-serif text-2xl font-bold text-[#1E1814] tabular-nums mt-1 block">
              {savedEvents.length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[#D8CDBC] flex gap-8 mb-8">
        <button
          onClick={() => setActiveTab('passes')}
          className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
            activeTab === 'passes' ? 'text-[#1E1814]' : 'text-[#675A50] hover:text-[#1E1814]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-[#8A4F33]" />
            My tickets ({purchasedBookings.length})
          </span>
          {activeTab === 'passes' && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8A4F33]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
            activeTab === 'saved' ? 'text-[#1E1814]' : 'text-[#675A50] hover:text-[#1E1814]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Bookmark className="w-4 h-4 text-[#8A4F33]" />
            Saved events ({savedEvents.length})
          </span>
          {activeTab === 'saved' && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8A4F33]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`pb-4 text-sm font-medium transition-colors relative cursor-pointer ${
            activeTab === 'security' ? 'text-[#1E1814]' : 'text-[#675A50] hover:text-[#1E1814]'
          }`}
        >
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#8A4F33]" />
            Security
          </span>
          {activeTab === 'security' && (
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#8A4F33]" />
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
                  className="bg-ivory rounded-3xl p-6 border border-[#D8CDBC] shadow-sand-sm hover:border-[#8A4F33] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#8A4F33] bg-[#8A4F33]/10 px-2.5 py-1 rounded-full">
                        {booking.ticketCode}
                      </span>
                      <span className="text-xs text-[#675A50]">
                        Booked {booking.bookingDate}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-medium text-[#1E1814] line-clamp-1">
                      {booking.eventTitle}
                    </h3>

                    <div className="text-xs text-[#675A50] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#8A4F33]" />
                        <span>{booking.eventDate} · {booking.eventTime}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#675A50]" />
                        <span className="truncate">{booking.venueName}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#E9E2D6] rounded-xl flex items-center justify-between text-xs text-[#1E1814]">
                      <span>
                        {booking.tierName} × {booking.quantity}
                      </span>
                      <div className="text-right">
                        <span className="font-serif font-bold tabular-nums block">
                          {booking.totalPrice > 0 ? `${formatKES(booking.totalPrice)} paid` : 'Free'}
                        </span>
                        {booking.paymentMethod === 'mpesa' && (
                          <span className="text-[10px] text-[#00A34D] font-mono font-medium flex items-center gap-1 justify-end">
                            <Smartphone className="w-3 h-3" />
                            M-Pesa
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-4 border-t border-[#D8CDBC] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPrintBooking(booking)}
                        title="Print ticket"
                        className="p-2 text-[#675A50] hover:text-[#8A4F33] hover:bg-[#E9E2D6] rounded-xl transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEmailBooking(booking)}
                        title="Email confirmation"
                        className="p-2 text-[#675A50] hover:text-[#8A4F33] hover:bg-[#E9E2D6] rounded-xl transition-colors cursor-pointer"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedPass(booking)}
                    >
                      View ticket
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-ivory rounded-3xl p-12 text-center border border-[#D8CDBC] shadow-sand-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#E9E2D6] flex items-center justify-center text-[#8A4F33] mb-4">
                <Ticket className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[#1E1814] mb-2">
                No tickets yet
              </h3>
              <p className="text-sm text-[#675A50] max-w-md mx-auto mb-6">
                Tickets you book for paid or free events will appear here.
              </p>
              <Button variant="primary" onClick={() => onNavigate('discover')}>
                Browse upcoming events
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Saved events */}
      {activeTab === 'saved' && (
        <div>
          {savedEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-ivory rounded-3xl p-4 border border-[#D8CDBC] hover:border-[#8A4F33] transition-all shadow-sand-sm flex flex-col justify-between group"
                >
                  <div>
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4">
                      <EventArtwork
                        imageUrl={event.imageUrl}
                        title={event.title}
                        category={event.category}
                        imageClassName="group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 left-2.5">
                        <Badge variant="neutral" size="sm">
                          {event.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-[#675A50] mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8A4F33]" />
                      <span>{event.date}</span>
                    </div>

                    <h4 className="font-serif text-lg font-medium text-[#1E1814] line-clamp-1 mb-2">
                      {event.title}
                    </h4>

                    <p className="text-xs text-[#675A50] line-clamp-2 leading-relaxed mb-4">
                      {event.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-[#D8CDBC] flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#1E1814] tabular-nums">
                      {event.isFree ? 'Free' : `from ${formatKES(event.pricing.startingPrice)}`}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onShareEvent && (
                        <button
                          type="button"
                          onClick={() => onShareEvent(event)}
                          title="Share event"
                          className="p-1.5 text-[#675A50] hover:text-[#8A4F33] hover:bg-[#E9E2D6] rounded-lg transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onRemoveBookmark(event.id)}
                        className="text-xs text-[#675A50] hover:text-red-700 px-2 py-1 cursor-pointer"
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
            <div className="bg-ivory rounded-3xl p-12 text-center border border-[#D8CDBC] shadow-sand-sm">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#E9E2D6] flex items-center justify-center text-[#675A50] mb-4">
                <Bookmark className="w-8 h-8 text-[#8A4F33]" />
              </div>
              <h3 className="font-serif text-2xl font-medium text-[#1E1814] mb-2">
                No saved events
              </h3>
              <p className="text-sm text-[#675A50] max-w-md mx-auto mb-6">
                Select the bookmark icon on any event to save it here for later.
              </p>
              <Button variant="primary" onClick={() => onNavigate('discover')}>
                Discover events
              </Button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Security */}
      {activeTab === 'security' && (
        <div className="max-w-2xl bg-ivory rounded-3xl p-6 sm:p-10 border border-[#D8CDBC] shadow-sand-sm space-y-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#8A4F33] font-bold block mb-1">
              Account security
            </span>
            <h3 className="font-serif text-2xl font-medium text-[#1E1814]">
              Change password
            </h3>
            <p className="text-xs text-[#675A50] mt-1">
              {user.authProvider === 'google'
                ? 'You sign in with Google, so your account has no MagiVents password to change.'
                : 'Use at least 8 characters, mixing letters, numbers and symbols.'}
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

          {user.authProvider !== 'google' && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Current password
              </label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Your current password"
                className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  New password
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                  Confirm new password
                </label>
                <input
                  type="password"
                  required
                  value={confirmNewPass}
                  onChange={(e) => setConfirmNewPass(e.target.value)}
                  placeholder="Type the new password again"
                  className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
                />
              </div>
            </div>

            <div className="pt-2">
              <Button variant="primary" type="submit">
                Update password
              </Button>
            </div>
          </form>
          )}
        </div>
      )}

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit profile"
        subtitle="Update your details and profile photo."
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
              ✓ Profile saved.
            </div>
          )}

          {/* Profile photo: initials until a photo is uploaded */}
          <div className="pt-1 space-y-3">
            <div className="flex items-center gap-4">
              <Avatar name={editName || user.name} src={editAvatarUrl} size="lg" />
              <div className="text-xs text-[#675A50] space-y-1">
                <span className="block font-semibold text-[#1E1814]">Profile photo</span>
                <span className="block">
                  {editAvatarUrl ? 'This photo is shown on your profile.' : 'Your initials are shown until you add a photo.'}
                </span>
                {editAvatarUrl && (
                  <button
                    type="button"
                    onClick={() => setEditAvatarUrl('')}
                    className="text-[#8A4F33] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove photo
                  </button>
                )}
              </div>
            </div>
            <ImageUploadZone
              helperText="PNG, JPG or WebP, up to 10 MB. A square photo of your face works best."
              value={editAvatarUrl}
              onChange={setEditAvatarUrl}
              shape="circle"
              aspectRatio="1:1"
              maxDimension={{ width: 800, height: 800 }}
              uploadButtonText="Upload photo"
              allowUrlInput={true}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
              Full name *
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your first and last name"
              className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                Email address *
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
                City / town
              </label>
              <input
                type="text"
                value={editCity}
                onChange={(e) => setEditCity(e.target.value)}
                placeholder="e.g. Nairobi, Kisumu, Mombasa"
                className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">
              Short bio
            </label>
            <textarea
              rows={3}
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="A sentence or two about you and the events you enjoy (optional)"
              className="w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] focus:outline-none focus:border-[#8A4F33]"
            />
          </div>

          <div className="pt-4 border-t border-[#D8CDBC] flex justify-end gap-3">
            <Button variant="ghost" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={authLoading}>
              {authLoading ? 'Saving...' : 'Save profile'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Digital Pass Inspector Modal */}
      {selectedPass && (
        <Modal
          isOpen={!!selectedPass}
          onClose={() => setSelectedPass(null)}
          title="Your ticket"
          subtitle="Show this ticket at the entrance."
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="bg-[#EFE8DD] border-2 border-[#D8CDBC] rounded-3xl p-6 sm:p-8 relative overflow-hidden">
              <div className="flex justify-between items-start pb-4 border-b border-dashed border-[#D8CDBC]">
                <div>
                  <span className="font-serif text-xl font-bold text-[#1E1814]">
                    MagiVents Ticket
                  </span>
                  <span className="text-[11px] uppercase tracking-widest text-[#675A50] block">
                    Admission ticket
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#8A4F33] bg-[#8A4F33]/10 px-2.5 py-1 rounded-full">
                  {selectedPass.ticketCode}
                </span>
              </div>

              <div className="py-4 space-y-2">
                <h3 className="font-serif text-xl font-medium text-[#1E1814]">
                  {selectedPass.eventTitle}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs text-[#675A50] pt-1">
                  <div>
                    <span className="font-semibold text-[#1E1814] block">Guest</span>
                    <span>{selectedPass.attendeeName}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1814] block">Tier</span>
                    <span>
                      {selectedPass.tierName} ({selectedPass.quantity} {selectedPass.quantity === 1 ? 'person' : 'people'})
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1814] block">Date</span>
                    <span>{selectedPass.eventDate} · {selectedPass.eventTime}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1E1814] block">Location</span>
                    <span className="truncate block">{selectedPass.venueName}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-[#D8CDBC] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-ivory rounded-xl border border-[#D8CDBC] flex items-center justify-center text-[#1E1814]">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div className="text-[11px] text-[#675A50]">
                    <span>Show at the entrance</span>
                    <span className="block font-medium text-[#1E1814]">
                      Issued {selectedPass.bookingDate}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-serif text-lg font-bold text-[#1E1814] tabular-nums block">
                    {selectedPass.totalPrice > 0 ? `${formatKES(selectedPass.totalPrice)} paid` : 'Free'}
                  </span>
                </div>
              </div>

              {selectedPass.paymentMethod === 'mpesa' && (
                <div className="p-3 bg-[#00A34D]/5 border border-[#00A34D]/20 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#00A34D]">
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span className="font-semibold">Paid with M-Pesa</span>
                  </div>
                  {selectedPass.mpesaReceiptNumber && (
                    <span className="font-mono text-[11px] text-[#1E1814]">
                      Ref: {selectedPass.mpesaReceiptNumber}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions: Print Ticket & Email Confirmation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                fullWidth
                icon={<Printer className="w-4 h-4 text-[#8A4F33]" />}
                onClick={() => setPrintBooking(selectedPass)}
              >
                Print ticket
              </Button>

              <Button
                variant="outline"
                fullWidth
                icon={<Mail className="w-4 h-4 text-[#8A4F33]" />}
                onClick={() => setEmailBooking(selectedPass)}
              >
                Email confirmation
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {onShareEvent && (
                <Button
                  variant="outline"
                  fullWidth
                  icon={<Share2 className="w-4 h-4 text-[#8A4F33]" />}
                  onClick={() => {
                    const matchedEvent = allEvents.find((e) => e.id === selectedPass.eventId) ||
                      savedEvents.find((e) => e.id === selectedPass.eventId);
                    if (matchedEvent) {
                      onShareEvent(matchedEvent);
                    }
                  }}
                >
                  Invite friends
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

      {/* Printable Ticket Pass Modal */}
      <PrintableTicketModal
        isOpen={!!printBooking}
        onClose={() => setPrintBooking(null)}
        booking={printBooking}
      />

      {/* Email Confirmation Packet Modal */}
      <EmailConfirmationModal
        isOpen={!!emailBooking}
        onClose={() => setEmailBooking(null)}
        booking={emailBooking}
      />
    </div>
  );
};
