import React from 'react';
import { Mail, MapPin } from 'lucide-react';

export const MAGIVENTS_EMAIL = 'magiventskenya@gmail.com';

export interface FooterProps {
  onNavigate: (view: 'discover' | 'organizer', tab?: 'grid' | 'calendar') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#EBE6DF] border-t border-[#E2DDD5] text-[#2A2421] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#E2DDD5]">
          {/* Brand */}
          <div className="md:col-span-5 space-y-4">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#2A2421]">
              MagiVents
            </span>
            <p className="text-sm text-[#736B66] leading-relaxed max-w-sm">
              Discover and book events across Kenya: sports, music, business, tech, education, arts, community and
              civic events. Organizers can publish paid or free events and sell tickets with M-Pesa.
            </p>
            <div className="text-xs text-[#736B66] pt-2 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#C85A40]" />
              <span>Nairobi, Kenya</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#2A2421] font-semibold block mb-2">
              Explore
            </span>
            <ul className="space-y-2 text-sm text-[#736B66]">
              <li>
                <button
                  onClick={() => onNavigate('discover', 'grid')}
                  className="hover:text-[#2A2421] transition-colors cursor-pointer"
                >
                  Discover events
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('discover', 'calendar')}
                  className="hover:text-[#2A2421] transition-colors cursor-pointer"
                >
                  Event calendar
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('organizer')}
                  className="hover:text-[#2A2421] transition-colors cursor-pointer"
                >
                  Organizer dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#2A2421] font-semibold block mb-2">
              Contact us
            </span>
            <p className="text-xs text-[#736B66] leading-relaxed">
              Questions about an event, a booking or listing your own event? Email the MagiVents team.
            </p>
            <a
              href={`mailto:${MAGIVENTS_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#C85A40] hover:text-[#A64831] transition-colors"
            >
              <Mail className="w-4 h-4" />
              {MAGIVENTS_EMAIL}
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#736B66]">
          <span>© {year} MagiVents Kenya. All rights reserved.</span>
          <a href={`mailto:${MAGIVENTS_EMAIL}`} className="hover:text-[#2A2421] transition-colors">
            {MAGIVENTS_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
};
