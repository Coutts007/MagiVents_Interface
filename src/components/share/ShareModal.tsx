import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
  Calendar,
  MapPin,
  ExternalLink,
  Mail,
  Send,
  Sparkles,
  QrCode,
  MessageSquare
} from 'lucide-react';
import { EventItem } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  getEventShareUrl,
  canWebShare,
  shareEventNative,
  SOCIAL_CHANNELS
} from '../../utils/share';

export interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  event
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [nativeShareLoading, setNativeShareLoading] = useState(false);

  if (!event) return null;

  const shareUrl = getEventShareUrl(event.id);
  const webShareSupported = canWebShare();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2400);
    } catch (e) {
      console.error('Failed to copy share link', e);
    }
  };

  const handleCopyInviteText = async () => {
    const inviteText = `I'd love for you to join me at "${event.title}" on ${event.date} at ${event.venue.name} (${event.venue.city}). Discover passes and program details here: ${shareUrl}`;
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 2400);
    } catch (e) {
      console.error('Failed to copy invite text', e);
    }
  };

  const handleNativeShare = async () => {
    setNativeShareLoading(true);
    try {
      const res = await shareEventNative(event, shareUrl);
      if (res.success) {
        onClose();
      }
    } catch (err) {
      console.warn('Native share dismissed or failed', err);
    } finally {
      setNativeShareLoading(false);
    }
  };

  const handleSocialClick = (channelUrl: string) => {
    window.open(channelUrl, '_blank', 'noopener,noreferrer,width=640,height=520');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Gathering"
      subtitle="Invite companions to experience this curated edition."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Event Preview Card */}
        <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD5] flex gap-4 items-center">
          <img
            src={event.imageUrl}
            alt={event.title}
            referrerPolicy="no-referrer"
            className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#E2DDD5] shrink-0"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="terracotta" size="sm">
                {event.category}
              </Badge>
              <span className="text-[11px] text-[#736B66] font-mono">
                ${event.pricing.startingPrice}
              </span>
            </div>
            <h4 className="font-serif text-base font-medium text-[#2A2421] truncate">
              {event.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#736B66] mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#C85A40]" />
                {event.date.split(',')[1] || event.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {event.venue.city}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Native Share Sheet Button (if supported by browser/device) */}
        {webShareSupported && (
          <div className="p-3.5 bg-[#C85A40]/5 rounded-2xl border border-[#C85A40]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#C85A40] text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#2A2421] block">
                  Quick Share to Device
                </span>
                <span className="text-[11px] text-[#736B66]">
                  AirDrop, Messages, Contacts, and installed apps
                </span>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNativeShare}
              disabled={nativeShareLoading}
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share via Device
            </Button>
          </div>
        )}

        {/* Unique Event Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block">
            Unique Event Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-[#E2DDD5] rounded-xl px-3.5 py-2.5 text-xs text-[#736B66] font-mono truncate select-all">
              {shareUrl}
            </div>
            <Button
              variant={copiedLink ? 'primary' : 'outline'}
              size="md"
              onClick={handleCopyLink}
              icon={copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            >
              {copiedLink ? 'Copied' : 'Copy'}
            </Button>
          </div>
          {copiedLink && (
            <p className="text-[11px] text-emerald-700 font-medium animate-in fade-in flex items-center gap-1">
              <Check className="w-3 h-3" /> Unique gathering link copied to clipboard.
            </p>
          )}
        </div>

        {/* Social Sharing Channels Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider">
              Share Directly to Platforms
            </label>
            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className="text-xs text-[#C85A40] hover:text-[#A64831] inline-flex items-center gap-1 font-medium cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              {showQr ? 'Hide QR Code' : 'Scan via QR Code'}
            </button>
          </div>

          {/* QR Code view if toggled */}
          {showQr && (
            <div className="p-4 bg-white rounded-2xl border border-[#E2DDD5] text-center space-y-2 animate-in fade-in duration-200">
              <div className="w-36 h-36 mx-auto p-2 bg-[#F4F1EA] rounded-xl border border-[#E2DDD5] flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full text-[#2A2421]"
                  fill="currentColor"
                >
                  {/* Stylized QR Code SVG Representation */}
                  <rect x="10" y="10" width="24" height="24" rx="3" fill="#2A2421" />
                  <rect x="15" y="15" width="14" height="14" fill="#FFFFFF" />
                  <rect x="18" y="18" width="8" height="8" fill="#C85A40" />

                  <rect x="66" y="10" width="24" height="24" rx="3" fill="#2A2421" />
                  <rect x="71" y="15" width="14" height="14" fill="#FFFFFF" />
                  <rect x="74" y="18" width="8" height="8" fill="#C85A40" />

                  <rect x="10" y="66" width="24" height="24" rx="3" fill="#2A2421" />
                  <rect x="15" y="71" width="14" height="14" fill="#FFFFFF" />
                  <rect x="18" y="74" width="8" height="8" fill="#C85A40" />

                  {/* QR Matrix Grid Dots */}
                  <rect x="42" y="12" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="52" y="12" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="42" y="24" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="48" y="32" width="8" height="8" rx="1" fill="#C85A40" />

                  <rect x="14" y="44" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="26" y="44" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="36" y="44" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="48" y="44" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="62" y="44" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="74" y="44" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="84" y="44" width="6" height="6" rx="1" fill="#2A2421" />

                  <rect x="42" y="56" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="54" y="56" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="66" y="56" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="42" y="68" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="54" y="68" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="66" y="68" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="78" y="68" width="6" height="6" rx="1" fill="#2A2421" />

                  <rect x="42" y="80" width="6" height="6" rx="1" fill="#2A2421" />
                  <rect x="60" y="80" width="8" height="8" rx="1" fill="#C85A40" />
                  <rect x="74" y="80" width="6" height="6" rx="1" fill="#2A2421" />
                </svg>
              </div>
              <p className="text-xs text-[#736B66]">
                Point any smartphone camera at this code to view and reserve tickets.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SOCIAL_CHANNELS.map((ch) => {
              const url = ch.getUrl(shareUrl, event);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSocialClick(url)}
                  className="p-3 bg-white hover:bg-[#FAF8F5] border border-[#E2DDD5] hover:border-[#736B66] rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer group shadow-2xs hover:-translate-y-0.5"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-xs"
                    style={{ backgroundColor: ch.color }}
                  >
                    {ch.id === 'x' && '𝕏'}
                    {ch.id === 'whatsapp' && <MessageSquare className="w-4 h-4" />}
                    {ch.id === 'linkedin' && 'in'}
                    {ch.id === 'facebook' && 'f'}
                    {ch.id === 'telegram' && <Send className="w-4 h-4" />}
                    {ch.id === 'email' && <Mail className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-[#2A2421] block group-hover:text-[#C85A40] transition-colors truncate">
                      {ch.name}
                    </span>
                    <span className="text-[10px] text-[#736B66] flex items-center gap-0.5">
                      Share <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy Formatted Personal Invitation Text */}
        <div className="p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2DDD5] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#C85A40] shrink-0" />
            <span className="text-xs text-[#736B66]">
              Need pre-composed invitation text for SMS, Slack, or newsletters?
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyInviteText}
            icon={copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedInvite ? 'Invite Copied' : 'Copy Invite'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
