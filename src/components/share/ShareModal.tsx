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
  MessageSquare
} from 'lucide-react';
import { EventItem } from '../../types';
import { formatKES } from '../../utils/format';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { EventArtwork } from '../ui/EventArtwork';
import {
  getEventShareUrl,
  canWebShare,
  shareEventNative,
  buildInviteText,
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
    const inviteText = buildInviteText(event, shareUrl);
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
      title="Share Event"
      subtitle="Invite friends, family or colleagues to this event."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Event Preview Card */}
        <div className="p-4 bg-[#EFE8DD] rounded-2xl border border-[#D8CDBC] flex gap-4 items-center">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#D8CDBC] shrink-0">
            <EventArtwork imageUrl={event.imageUrl} title={event.title} category={event.category} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="terracotta" size="sm">
                {event.category}
              </Badge>
              <span className="text-[11px] text-[#675A50] font-mono">
                {event.isFree ? 'Free' : `From ${formatKES(event.pricing.startingPrice)}`}
              </span>
            </div>
            <h4 className="font-serif text-base font-medium text-[#1E1814] truncate">
              {event.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-[#675A50] mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#8A4F33]" />
                {event.date.split(',')[1] || event.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3" />
                {event.venue.city || event.venue.name}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Native Share Sheet Button (if supported by browser/device) */}
        {webShareSupported && (
          <div className="p-3.5 bg-[#8A4F33]/5 rounded-2xl border border-[#8A4F33]/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8A4F33] text-white flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-[#1E1814] block">
                  Share from your device
                </span>
                <span className="text-[11px] text-[#675A50]">
                  Messages, WhatsApp and other installed apps
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
              Share
            </Button>
          </div>
        )}

        {/* Unique Event Link Box */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block">
            Event Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-ivory border border-[#D8CDBC] rounded-xl px-3.5 py-2.5 text-xs text-[#675A50] font-mono truncate select-all">
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
              <Check className="w-3 h-3" /> Event link copied.
            </p>
          )}
        </div>

        {/* Social Sharing Channels Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider">
              Share on
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SOCIAL_CHANNELS.map((ch) => {
              const url = ch.getUrl(shareUrl, event);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSocialClick(url)}
                  className="p-3 bg-ivory hover:bg-[#EFE8DD] border border-[#D8CDBC] hover:border-[#675A50] rounded-xl flex items-center gap-2.5 transition-all text-left cursor-pointer group shadow-2xs hover:-translate-y-0.5"
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
                    <span className="text-xs font-medium text-[#1E1814] block group-hover:text-[#8A4F33] transition-colors truncate">
                      {ch.name}
                    </span>
                    <span className="text-[10px] text-[#675A50] flex items-center gap-0.5">
                      Share <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Copy Formatted Personal Invitation Text */}
        <div className="p-3.5 bg-[#EFE8DD] rounded-2xl border border-[#D8CDBC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#8A4F33] shrink-0" />
            <span className="text-xs text-[#675A50]">
              Copy a ready-made invitation for SMS or group chats.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyInviteText}
            icon={copiedInvite ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copiedInvite ? 'Copied' : 'Copy Invite'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
