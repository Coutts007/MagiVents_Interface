import { EventItem } from '../types';

export function getEventShareUrl(eventId: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('event', eventId);
  return url.toString();
}

export function canWebShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

export async function shareEventNative(
  event: EventItem,
  customUrl?: string
): Promise<{ success: boolean; canceled?: boolean; error?: any }> {
  const shareUrl = customUrl || getEventShareUrl(event.id);
  const shareText = `Join me at "${event.title}" — ${event.subtitle || event.description.slice(0, 100)}`;

  if (canWebShare()) {
    try {
      await navigator.share({
        title: `${event.title} · MagiVents`,
        text: shareText,
        url: shareUrl
      });
      return { success: true };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, canceled: true };
      }
      return { success: false, error: err };
    }
  }
  return { success: false };
}

export interface SocialShareChannel {
  id: string;
  name: string;
  color: string;
  hoverColor: string;
  iconBg: string;
  getUrl: (url: string, event: EventItem) => string;
}

export const SOCIAL_CHANNELS: SocialShareChannel[] = [
  {
    id: 'x',
    name: 'X (Twitter)',
    color: '#000000',
    hoverColor: '#1a1a1a',
    iconBg: '#F4F1EA',
    getUrl: (url, event) => {
      const text = encodeURIComponent(
        `Gathering at "${event.title}" (${event.date} · ${event.venue.city}). Discover passes on @MagiVents:`
      );
      return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
    }
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    hoverColor: '#20BA5A',
    iconBg: '#E8F8EE',
    getUrl: (url, event) => {
      const text = encodeURIComponent(
        `Thought of you for this gathering: *${event.title}* on ${event.date} at ${event.venue.name} (${event.venue.city}).\n\nFull details & passes: ${url}`
      );
      return `https://api.whatsapp.com/send?text=${text}`;
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    hoverColor: '#084E96',
    iconBg: '#E7F0FA',
    getUrl: (url) => {
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    hoverColor: '#135ECC',
    iconBg: '#E8F1FC',
    getUrl: (url) => {
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    }
  },
  {
    id: 'telegram',
    name: 'Telegram',
    color: '#229ED9',
    hoverColor: '#1B86BA',
    iconBg: '#E7F5FB',
    getUrl: (url, event) => {
      const text = encodeURIComponent(
        `Join me at "${event.title}" on ${event.date} (${event.venue.city}):`
      );
      return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`;
    }
  },
  {
    id: 'email',
    name: 'Email Invitation',
    color: '#C85A40',
    hoverColor: '#A64831',
    iconBg: '#FAEDE9',
    getUrl: (url, event) => {
      const subject = encodeURIComponent(`Invitation: ${event.title} — ${event.date}`);
      const body = encodeURIComponent(
        `Hello,\n\nI would love for you to join me at this upcoming gathering:\n\n${event.title}\n${event.subtitle}\n\nDate: ${event.date} (${event.time})\nVenue: ${event.venue.name}, ${event.venue.address}, ${event.venue.city}\n\nYou can reserve passes and view the full evening itinerary here:\n${url}\n\nWarmly,\n`
      );
      return `mailto:?subject=${subject}&body=${body}`;
    }
  }
];
