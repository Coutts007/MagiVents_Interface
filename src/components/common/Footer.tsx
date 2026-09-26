import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';

export interface FooterProps {
  onNavigate: (view: 'discover' | 'organizer') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="w-full bg-[#EBE6DF] border-t border-[#E2DDD5] text-[#2A2421] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-[#E2DDD5]">
          {/* Brand & Manifesto */}
          <div className="md:col-span-5 space-y-4">
            <span className="font-serif text-3xl font-bold tracking-tight text-[#2A2421]">
              MagiVents
            </span>
            <p className="text-sm text-[#736B66] leading-relaxed max-w-sm">
              A curated platform for lovers of acoustic purity, seasonal gastronomy, and architectural reverence. We gather where beauty and dialogue converge.
            </p>
            <div className="text-xs text-[#736B66] space-y-1 pt-2">
              <span className="block font-medium text-[#2A2421]">Curatorial Headquarters</span>
              <span>Provence · Kyoto · Stockholm · Tuscany</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#2A2421] font-semibold block mb-2">
              Platform Directory
            </span>
            <ul className="space-y-2 text-sm text-[#736B66]">
              <li>
                <button
                  onClick={() => onNavigate('discover')}
                  className="hover:text-[#2A2421] transition-colors cursor-pointer"
                >
                  Featured Gatherings
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('organizer')}
                  className="hover:text-[#2A2421] transition-colors cursor-pointer"
                >
                  Curator & Host Portal
                </button>
              </li>
              <li>
                <span className="text-[#736B66]/70">Architectural Venues</span>
              </li>
              <li>
                <span className="text-[#736B66]/70">The Acoustic Standard</span>
              </li>
            </ul>
          </div>

          {/* Curatorial Gazette / Newsletter */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-xs uppercase tracking-widest text-[#2A2421] font-semibold block mb-2">
              The Curatorial Dispatch
            </span>
            <p className="text-xs text-[#736B66] leading-relaxed">
              Bi-weekly invitations to unannounced chamber sessions, harvest dinners, and design monographs.
            </p>

            <form onSubmit={handleSubscribe} className="pt-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@domain.com"
                  className="flex-1 px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-full text-xs text-[#2A2421] placeholder-[#736B66]/60 focus:outline-none focus:border-[#C85A40]"
                />
                <Button variant="primary" size="sm" type="submit">
                  {subscribed ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
              {subscribed && (
                <span className="text-[11px] text-emerald-800 mt-2 block font-medium">
                  ✓ You are on the curatorial guestlist.
                </span>
              )}
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#736B66]">
          <span>© 2026 MagiVents Platform. Crafted with warmth & precision.</span>
          <div className="flex items-center gap-6">
            <span>Curatorial Code</span>
            <span>·</span>
            <span>Privacy & Ethics</span>
            <span>·</span>
            <span>Accessibility (WCAG AA)</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
