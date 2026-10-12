import { describe, expect, it } from 'vitest';
import { makeEvent } from '../test/fixtures';
import { SOCIAL_CHANNELS, buildInviteText, canWebShare, getEventShareUrl } from './share';

const event = makeEvent();
const url = 'https://magivents.co.ke/?event=nairobi-sounds-live';
const channel = (id: string) => SOCIAL_CHANNELS.find((c) => c.id === id)!;

describe('share links', () => {
  it('builds the invite text with date and place', () => {
    expect(buildInviteText(event, url)).toBe(
      `Join me at Nairobi Sounds Live on Friday, 20 Nov 2026 at Kenya National Theatre, Nairobi. Get tickets on MagiVents: ${url}`
    );
  });

  it('encodes the link for each channel', () => {
    expect(channel('whatsapp').getUrl(url, event)).toContain('api.whatsapp.com/send?text=');
    expect(channel('whatsapp').getUrl(url, event)).toContain(encodeURIComponent(url));
    expect(channel('facebook').getUrl(url, event)).toBe(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    );
    expect(channel('x').getUrl(url, event)).toContain(`&url=${encodeURIComponent(url)}`);
    const mail = channel('email').getUrl(url, event);
    expect(mail.startsWith('mailto:?subject=')).toBe(true);
    expect(decodeURIComponent(mail)).toContain('Venue: Kenya National Theatre, Harry Thuku Road, Nairobi');
  });

  it('degrades outside the browser', () => {
    expect(getEventShareUrl('x')).toBe('');
    expect(canWebShare()).toBe(false);
  });
});
