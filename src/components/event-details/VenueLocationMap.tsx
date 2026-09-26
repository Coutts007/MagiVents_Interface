import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Plus,
  Minus,
  RotateCcw,
  ExternalLink,
  Layers,
  Copy,
  Check,
  Car,
  Footprints
} from 'lucide-react';
import { EventItem } from '../../types';
import { Button } from '../ui/Button';

export interface VenueLocationMapProps {
  venue: EventItem['venue'];
  eventTitle: string;
}

type MapTheme = 'parchment' | 'architectural' | 'evening';

export const VenueLocationMap: React.FC<VenueLocationMapProps> = ({
  venue,
  eventTitle
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapTheme, setMapTheme] = useState<MapTheme>('parchment');
  const [isCopied, setIsCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);

  const coords = venue.coordinates || { lat: 43.9113, lng: 5.2003 };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(1.8, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.75, +(z - 0.25).toFixed(2)));
  const handleReset = () => {
    setZoomLevel(1);
    setShowTooltip(true);
  };

  const handleCopyCoords = () => {
    const text = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const openExternalMaps = () => {
    const query = encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  // Color schemes by theme
  const themeClasses = {
    parchment: {
      container: 'bg-[#F4F1EA] text-[#2A2421]',
      grid: '#E2DDD5',
      roadPrimary: '#D5CEC2',
      roadSecondary: '#E5DFD4',
      water: '#D1DCD6',
      parcel: '#ECE6DC',
      contour: '#DFD8CC',
      label: '#736B66'
    },
    architectural: {
      container: 'bg-[#EFECE6] text-[#2A2421]',
      grid: '#DDD8CE',
      roadPrimary: '#C9C2B5',
      roadSecondary: '#DDD6C9',
      water: '#C5D3CE',
      parcel: '#E5E1D8',
      contour: '#D0C9BD',
      label: '#5C544F'
    },
    evening: {
      container: 'bg-[#25201D] text-[#F4F1EA]',
      grid: '#362F2B',
      roadPrimary: '#423A35',
      roadSecondary: '#2E2724',
      water: '#2C3A3B',
      parcel: '#2B2421',
      contour: '#3B332E',
      label: '#A39992'
    }
  };

  const currentColors = themeClasses[mapTheme];

  return (
    <div className="w-full space-y-4">
      {/* Map Canvas Container */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[340px] sm:min-h-[400px] rounded-3xl overflow-hidden border border-[#E2DDD5] shadow-sand-md select-none">
        {/* Background SVG Map with Zoom and Pan Transform */}
        <div
          className={`absolute inset-0 transition-transform duration-500 ease-out flex items-center justify-center ${currentColors.container}`}
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            className="w-full h-full object-cover"
            viewBox="0 0 1000 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Canvas */}
            <rect width="1000" height="600" fill={currentColors.container.split(' ')[0].replace('bg-[', '').replace(']', '')} />

            {/* Subtle Grid Lines */}
            <defs>
              <pattern id="carto-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke={currentColors.grid} strokeWidth="0.75" strokeDasharray="3 3" />
              </pattern>
            </defs>
            <rect width="1000" height="600" fill="url(#carto-grid)" opacity="0.6" />

            {/* Natural Terrain & Waterway (Curving River/Bay) */}
            <path
              d="M -50 480 C 150 460, 220 540, 420 510 C 620 480, 750 560, 1050 520 L 1050 650 L -50 650 Z"
              fill={currentColors.water}
              opacity="0.75"
            />
            <path
              d="M 680 -50 C 720 120, 840 220, 920 340 C 970 420, 1040 450, 1080 500"
              stroke={currentColors.water}
              strokeWidth="24"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />

            {/* Topography Elevation Contours */}
            <path
              d="M 120 80 Q 280 40 380 120 T 640 90 T 820 180"
              stroke={currentColors.contour}
              strokeWidth="1.2"
              fill="none"
              opacity="0.8"
            />
            <path
              d="M 90 120 Q 270 90 370 160 T 630 140 T 840 220"
              stroke={currentColors.contour}
              strokeWidth="1"
              fill="none"
              opacity="0.6"
            />
            <path
              d="M 160 160 Q 300 130 420 200 T 680 190 T 860 260"
              stroke={currentColors.contour}
              strokeWidth="0.8"
              fill="none"
              opacity="0.5"
            />

            {/* Surrounding Architectural / Land Parcels */}
            <rect x="220" y="160" width="130" height="90" rx="8" fill={currentColors.parcel} stroke={currentColors.grid} strokeWidth="1" />
            <rect x="380" y="140" width="90" height="110" rx="8" fill={currentColors.parcel} stroke={currentColors.grid} strokeWidth="1" />
            <rect x="260" y="320" width="150" height="85" rx="8" fill={currentColors.parcel} stroke={currentColors.grid} strokeWidth="1" />
            <rect x="580" y="180" width="160" height="110" rx="8" fill={currentColors.parcel} stroke={currentColors.grid} strokeWidth="1" />
            <rect x="620" y="320" width="120" height="95" rx="8" fill={currentColors.parcel} stroke={currentColors.grid} strokeWidth="1" />

            {/* Secondary Roads */}
            <path d="M 0 280 L 1000 280" stroke={currentColors.roadSecondary} strokeWidth="10" strokeLinecap="round" />
            <path d="M 500 0 L 500 600" stroke={currentColors.roadSecondary} strokeWidth="10" strokeLinecap="round" />
            <path d="M 220 0 C 240 200, 220 400, 260 600" stroke={currentColors.roadSecondary} strokeWidth="8" strokeDasharray="6 4" />
            <path d="M 760 0 C 740 220, 780 380, 760 600" stroke={currentColors.roadSecondary} strokeWidth="8" strokeDasharray="6 4" />

            {/* Primary Highway / Boulevard */}
            <path
              d="M 0 350 C 280 340, 420 290, 500 290 C 620 290, 780 330, 1000 310"
              stroke={currentColors.roadPrimary}
              strokeWidth="18"
              strokeLinecap="round"
              fill="none"
            />

            {/* Road Inner Line */}
            <path
              d="M 0 350 C 280 340, 420 290, 500 290 C 620 290, 780 330, 1000 310"
              stroke={currentColors.container.split(' ')[0].replace('bg-[', '').replace(']', '')}
              strokeWidth="2"
              strokeDasharray="8 8"
              fill="none"
              opacity="0.8"
            />

            {/* Venue Grounds / Courtyard Pavilion Highlight */}
            <circle cx="500" cy="285" r="54" fill="#C85A40" fillOpacity="0.08" stroke="#C85A40" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="500" cy="285" r="32" fill="#C85A40" fillOpacity="0.12" />

            {/* Olive Groves / Vineyard Stippling */}
            <g fill={currentColors.label} opacity="0.35">
              <circle cx="180" cy="110" r="2.5" />
              <circle cx="200" cy="115" r="2.5" />
              <circle cx="170" cy="130" r="2.5" />
              <circle cx="190" cy="135" r="2.5" />
              <circle cx="680" cy="120" r="2.5" />
              <circle cx="700" cy="125" r="2.5" />
              <circle cx="670" cy="140" r="2.5" />
              <circle cx="690" cy="145" r="2.5" />
            </g>

            {/* Geographic & Access Labels */}
            <text x="70" y="270" fill={currentColors.label} fontSize="11" fontFamily="sans-serif" letterSpacing="2" fontWeight="500">
              AVENUE DES OLIVIERS
            </text>
            <text x="520" y="60" fill={currentColors.label} fontSize="11" fontFamily="sans-serif" letterSpacing="2" fontWeight="500">
              NORTH GATE ACCESS
            </text>
            <text x="820" y="550" fill={currentColors.label} fontSize="11" fontFamily="sans-serif" letterSpacing="2" fontWeight="500">
              RIVER BASIN
            </text>
          </svg>
        </div>

        {/* Pulsing Venue Pin Element (Centered at map focus point) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative pointer-events-auto cursor-pointer" onClick={() => setShowTooltip(!showTooltip)}>
            {/* Concentric Pulsing Radar Rings */}
            <div className="absolute -inset-4 rounded-full bg-[#C85A40]/25 animate-ping duration-1000" />
            <div className="absolute -inset-2 rounded-full bg-[#C85A40]/40 animate-pulse duration-700" />

            {/* Physical Teardrop Terracotta Pin Marker */}
            <div className="relative w-11 h-11 bg-[#C85A40] hover:bg-[#A64831] text-white rounded-full shadow-sand-lg border-2 border-white flex items-center justify-center transform -translate-y-2 hover:scale-110 transition-all duration-300">
              <MapPin className="w-5 h-5" fill="currentColor" />
            </div>

            {/* Pin shadow on ground */}
            <div className="w-6 h-2 bg-black/25 rounded-full blur-[2px] mx-auto -mt-1" />

            {/* Floating Interactive Callout Tooltip */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3.5 w-64 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-[#E2DDD5] shadow-sand-xl text-left animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#C85A40] font-bold block">
                      Confirmed Venue
                    </span>
                    <h4 className="font-serif text-sm font-semibold text-[#2A2421] leading-snug line-clamp-1 mt-0.5">
                      {venue.name}
                    </h4>
                    <p className="text-[11px] text-[#736B66] line-clamp-1 mt-0.5">
                      {venue.neighborhood} · {venue.city}
                    </p>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E2DDD5] flex items-center justify-between text-[10px] text-[#736B66]">
                  <span className="font-mono tabular-nums">
                    {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                  </span>
                  <span className="text-[#C85A40] font-medium flex items-center gap-0.5">
                    <Compass className="w-3 h-3" />
                    Center
                  </span>
                </div>

                {/* Triangle indicator */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-3 h-3 bg-white/95 border-r border-b border-[#E2DDD5] transform rotate-45" />
              </div>
            )}
          </div>
        </div>

        {/* Map Top Bar: Coordinate Badge & Compass */}
        <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
          <div className="bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E2DDD5] text-xs font-mono font-medium text-[#2A2421] shadow-sand-sm flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-[#C85A40]" />
            <span>{coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E</span>
          </div>

          <button
            onClick={handleCopyCoords}
            aria-label="Copy coordinates"
            title="Copy coordinates"
            className="p-2 rounded-full bg-white/90 backdrop-blur-md border border-[#E2DDD5] text-[#736B66] hover:text-[#2A2421] hover:bg-white transition-colors cursor-pointer shadow-sand-sm"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Map Theme Toggle (Top Right) */}
        <div className="absolute top-4 right-4 z-30 flex items-center bg-white/90 backdrop-blur-md p-1 rounded-full border border-[#E2DDD5] shadow-sand-sm">
          <button
            onClick={() => setMapTheme('parchment')}
            title="Parchment Cartography"
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              mapTheme === 'parchment'
                ? 'bg-[#2A2421] text-white shadow-xs'
                : 'text-[#736B66] hover:text-[#2A2421]'
            }`}
          >
            Parchment
          </button>
          <button
            onClick={() => setMapTheme('architectural')}
            title="Architectural Contours"
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              mapTheme === 'architectural'
                ? 'bg-[#2A2421] text-white shadow-xs'
                : 'text-[#736B66] hover:text-[#2A2421]'
            }`}
          >
            Blueprint
          </button>
          <button
            onClick={() => setMapTheme('evening')}
            title="Evening Lantern Mode"
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
              mapTheme === 'evening'
                ? 'bg-[#2A2421] text-white shadow-xs'
                : 'text-[#736B66] hover:text-[#2A2421]'
            }`}
          >
            Evening
          </button>
        </div>

        {/* Zoom & Center Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-30 flex flex-col gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-[#E2DDD5] shadow-sand-sm">
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 1.75}
            aria-label="Zoom in"
            title="Zoom in"
            className="p-2 rounded-xl text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 0.8}
            aria-label="Zoom out"
            title="Zoom out"
            className="p-2 rounded-xl text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="w-full h-px bg-[#E2DDD5]" />
          <button
            onClick={handleReset}
            aria-label="Recenter venue pin"
            title="Recenter venue pin"
            className="p-2 rounded-xl text-[#736B66] hover:text-[#C85A40] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Map Scale Indicator (Bottom Left) */}
        <div className="absolute bottom-4 left-4 z-30 hidden sm:flex items-center gap-2 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-[#E2DDD5] text-[10px] font-mono text-[#736B66]">
          <div className="w-10 h-1 bg-[#2A2421] border-x border-[#2A2421]" />
          <span>250 m</span>
        </div>
      </div>

      {/* Venue Access & Directions Strip */}
      <div className="bg-[#F4F1EA] rounded-2xl p-5 border border-[#E2DDD5] flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#2A2421]">
              {venue.name}
            </span>
            <span className="text-[#E2DDD5]">·</span>
            <span className="text-xs text-[#736B66]">{venue.city}</span>
          </div>
          <p className="text-xs text-[#736B66]">
            {venue.address}, {venue.neighborhood}
          </p>
          {venue.mapNote && (
            <p className="text-xs text-[#C85A40] font-medium pt-0.5 flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5" />
              <span>{venue.mapNote}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            icon={<Navigation className="w-3.5 h-3.5" />}
            onClick={openExternalMaps}
          >
            Get Directions
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            onClick={openExternalMaps}
          >
            Open in Maps
          </Button>
        </div>
      </div>
    </div>
  );
};
