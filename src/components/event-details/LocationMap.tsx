import React, { Suspense, lazy, useEffect, useState } from 'react';
import { MapPin, Maximize2, Minimize2, ExternalLink, Copy, Check, Car, Train, Info } from 'lucide-react';
import { EventItem } from '../../types';
import { Button } from '../ui/Button';

// Leaflet is only downloaded when a map is actually shown
const VenueMap = lazy(() => import('../map/VenueMap'));

export interface LocationMapProps {
  venue: EventItem['venue'];
  eventTitle: string;
  category?: string;
}

type TransitTab = 'arrival' | 'transit' | 'parking';

export const LocationMap: React.FC<LocationMapProps> = ({ venue, eventTitle }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTransitTab, setActiveTransitTab] = useState<TransitTab>('arrival');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Without organizer-set coordinates there is no pin: a guessed pin would send people to the wrong place
  const coordinates = venue.coordinates ?? null;
  const area = [venue.neighborhood, venue.city].filter(Boolean).join(' · ');
  const fullAddress = [venue.name, venue.address, venue.neighborhood, venue.city].filter(Boolean).join(', ');
  const coordsString = coordinates ? `${coordinates.lat.toFixed(5)}, ${coordinates.lng.toFixed(5)}` : '';
  const coordsLabel = coordinates
    ? `${Math.abs(coordinates.lat).toFixed(4)}° ${coordinates.lat >= 0 ? 'N' : 'S'}, ${Math.abs(coordinates.lng).toFixed(4)}° ${
        coordinates.lng >= 0 ? 'E' : 'W'
      }`
    : '';

  const handleCopyCoords = () => {
    if (navigator.clipboard && coordsString) {
      navigator.clipboard.writeText(coordsString);
      setCopiedCoords(true);
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(fullAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const openGoogleMaps = () => {
    // Exact coordinates when the organizer set them, otherwise search by name and address
    const query = encodeURIComponent(coordsString || [venue.name, venue.address, venue.city, 'Kenya'].filter(Boolean).join(', '));
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener');
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#1E1814]/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center'
          : ''
      }
    >
      <div
        className={`bg-ivory rounded-3xl border border-[#D8CDBC] shadow-sand-sm overflow-hidden w-full ${
          isFullscreen ? 'max-w-6xl h-[92vh] flex flex-col' : ''
        }`}
      >
        {coordinates ? (
          <div className={`relative ${isFullscreen ? 'flex-1 min-h-0' : 'h-72 sm:h-96'}`}>
            <Suspense fallback={<div className="w-full h-full animate-shimmer" aria-label="Loading map" />}>
              <VenueMap
                position={coordinates}
                label={`Map showing ${venue.name}`}
                popup={`<strong>${escapeHtml(venue.name)}</strong><br>${escapeHtml(eventTitle)}`}
                className="w-full h-full"
                sizeKey={isFullscreen}
              />
            </Suspense>
            <div className="absolute top-3 right-3 z-[500] flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCoords}
                title="Copy coordinates"
                className="px-3 py-2 rounded-full bg-ivory/95 border border-[#D8CDBC] shadow-sand-sm text-[11px] font-medium text-[#1E1814] hover:bg-ivory flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#8A4F33]" />}
                <span className="hidden sm:inline font-mono">{copiedCoords ? 'Copied' : coordsLabel}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen((v) => !v)}
                aria-label={isFullscreen ? 'Exit full screen map' : 'Expand map full screen'}
                title={isFullscreen ? 'Exit full screen (Esc)' : 'Full screen'}
                className="p-2.5 rounded-full bg-ivory/95 border border-[#D8CDBC] shadow-sand-sm text-[#1E1814] hover:bg-ivory cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-[#EFE8DD] flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-ivory border border-[#D8CDBC] flex items-center justify-center shrink-0">
              <MapPin className="w-6 h-6 text-[#8A4F33]" />
            </div>
            <div className="space-y-1">
              <p className="font-serif text-lg text-[#1E1814]">{venue.name}</p>
              <p className="text-sm text-[#675A50]">{fullAddress}</p>
              <p className="text-xs text-[#675A50]">
                The organizer has not pinned this venue on a map. Use Directions to search for it.
              </p>
            </div>
          </div>
        )}

        {/* Venue Information & Directions Sub-Bar */}
        <div className="p-5 sm:p-6 bg-ivory border-t border-[#D8CDBC] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#1E1814]">
                  {venue.address || venue.name}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-xs text-[#675A50] hover:text-[#1E1814] p-1 rounded-md hover:bg-[#E9E2D6] transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3 h-3 text-[#675A50]" />
                  )}
                </button>
              </div>
              {area && (
                <p className="text-xs text-[#675A50] mt-0.5">
                  {area}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyAddress}
                icon={<Copy className="w-3.5 h-3.5" />}
              >
                Copy address
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={openGoogleMaps}
                icon={<ExternalLink className="w-3.5 h-3.5" />}
              >
                Directions
              </Button>
            </div>
          </div>

          {/* Transit and Arrival Guidance Tabs */}
          <div className="pt-3 border-t border-[#D8CDBC]/60">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTransitTab('arrival')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTransitTab === 'arrival'
                    ? 'bg-[#8A4F33]/10 text-[#8A4F33] border border-[#8A4F33]/30 font-semibold'
                    : 'text-[#675A50] hover:text-[#1E1814] bg-[#E9E2D6]'
                }`}
              >
                <Info className="w-3 h-3" />
                Arrival
              </button>
              <button
                type="button"
                onClick={() => setActiveTransitTab('parking')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTransitTab === 'parking'
                    ? 'bg-[#8A4F33]/10 text-[#8A4F33] border border-[#8A4F33]/30 font-semibold'
                    : 'text-[#675A50] hover:text-[#1E1814] bg-[#E9E2D6]'
                }`}
              >
                <Car className="w-3 h-3" />
                Parking
              </button>
              <button
                type="button"
                onClick={() => setActiveTransitTab('transit')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTransitTab === 'transit'
                    ? 'bg-[#8A4F33]/10 text-[#8A4F33] border border-[#8A4F33]/30 font-semibold'
                    : 'text-[#675A50] hover:text-[#1E1814] bg-[#E9E2D6]'
                }`}
              >
                <Train className="w-3 h-3" />
                Getting there
              </button>
            </div>

            <div className="bg-[#EFE8DD] p-3.5 rounded-2xl border border-[#D8CDBC] text-xs text-[#675A50] leading-relaxed">
              {activeTransitTab === 'arrival' && (
                <p>
                  <strong className="text-[#1E1814] font-medium">From the organizer: </strong>
                  {venue.mapNote?.trim() ||
                    'Arrive early to allow time for check-in, and have your ticket code ready on your phone or printed.'}
                </p>
              )}
              {activeTransitTab === 'parking' && (
                <p>
                  <strong className="text-[#1E1814] font-medium">Parking: </strong>
                  Parking arrangements at {venue.name} are set by the venue. Check with the organizer before you travel, or use public transport or ride-hailing.
                </p>
              )}
              {activeTransitTab === 'transit' && (
                <p>
                  <strong className="text-[#1E1814] font-medium">Getting there: </strong>
                  {venue.name} is in {[venue.neighborhood, venue.city].filter(Boolean).join(', ') || 'the location shown'}. Use Directions for a route by car, matatu, boda boda or ride-hailing.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}
