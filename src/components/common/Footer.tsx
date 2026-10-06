import React from 'react';
import { Mail, MapPin } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

export const MAGIVENTS_EMAIL = 'magiventskenya@gmail.com';

export interface FooterProps {
  onNavigate: (view: 'discover' | 'organizer', tab?: 'grid' | 'calendar') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-footer-fade text-[#F3E9DE] transition-colors">
      <div aria-hidden="true" className="h-[2px] bg-brand-gold opacity-80" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/10">
          {/* Brand */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo className="h-10" />
            <p className="text-sm text-[#CDBFB2] leading-relaxed max-w-sm">
              Discover and book events across Kenya: sports, music, business, tech, education, arts, community and
              civic events. Organizers can publish paid or free events and sell tickets with M-Pesa.
            </p>
            <div className="text-xs text-[#CDBFB2] pt-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#C39177]" />
              <span>Nairobi, Kenya</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#C7B173] font-semibold block mb-2">
              Explore
            </span>
            <ul className="space-y-2 text-sm text-[#CDBFB2]">
              <li>
                <button
                  onClick={() => onNavigate('discover', 'grid')}
                  className="hover:text-[#F3E9DE] transition-colors cursor-pointer"
                >
                  Discover events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('discover', 'calendar')}
                  className="hover:text-[#F3E9DE] transition-colors cursor-pointer"
                >
                  Event calendar
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('organizer')}
                  className="hover:text-[#F3E9DE] transition-colors cursor-pointer"
                >
                  Organizer dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#C7B173] font-semibold block mb-2">
              Contact us
            </span>
            <p className="text-xs text-[#CDBFB2] leading-relaxed">
              Questions about an event, a booking or listing your own event? Email the MagiVents team.
            </p>
            <a
              href={`mailto:${MAGIVENTS_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#E3B5A1] hover:text-[#F6EEA6] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {MAGIVENTS_EMAIL}
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#CDBFB2]">
          <span>© {year} MagiVents Kenya. All rights reserved.</span>
          <a href={`mailto:${MAGIVENTS_EMAIL}`} className="hover:text-[#F3E9DE] transition-colors">
            {MAGIVENTS_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
};
