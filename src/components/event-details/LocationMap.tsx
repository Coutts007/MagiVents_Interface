import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
  Copy,
  Check,
  Car,
  Train,
  Info,
  Layers,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { EventItem } from '../../types';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface LocationMapProps {
  venue: EventItem['venue'];
  eventTitle: string;
  category?: string;
}

type MapTheme = 'editorial' | 'blueprint' | 'topographic';
type TransitTab = 'arrival' | 'transit' | 'parking';

export const LocationMap: React.FC<LocationMapProps> = ({
  venue,
  eventTitle,
  category
}) => {
  const [zoom, setZoom] = useState(1.2);
  const [mapTheme, setMapTheme] = useState<MapTheme>('editorial');
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTransitTab, setActiveTransitTab] = useState<TransitTab>('arrival');
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showPinTooltip, setShowPinTooltip] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  // Format coordinates (Nairobi CBD when the organizer gave none)
  const lat = venue.coordinates?.lat ?? -1.2864;
  const lng = venue.coordinates?.lng ?? 36.8172;
  const hasCoordinates = Boolean(venue.coordinates);
  const area = [venue.neighborhood, venue.city].filter(Boolean).join(' · ');
  const fullAddress = [venue.name, venue.address, venue.neighborhood, venue.city].filter(Boolean).join(', ');
  const latFormatted = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lngFormatted = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
  const coordsString = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  const handleCopyCoords = () => {
    if (navigator.clipboard) {
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
    const query = encodeURIComponent(
      hasCoordinates ? coordsString : [venue.name, venue.address, venue.city, 'Kenya'].filter(Boolean).join(', ')
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank', 'noopener');
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    // Constrain pan within limits
    const maxPan = 140 * zoom;
    setPanOffset({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const newX = e.touches[0].clientX - dragStart.x;
    const newY = e.touches[0].clientY - dragStart.y;
    const maxPan = 140 * zoom;
    setPanOffset({
      x: Math.max(-maxPan, Math.min(maxPan, newX)),
      y: Math.max(-maxPan, Math.min(maxPan, newY))
    });
  };

  const handleReset = () => {
    setZoom(1.2);
    setPanOffset({ x: 0, y: 0 });
  };

  // Keyboard navigation for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 p-4 sm:p-8 bg-[#2A2421]/80 backdrop-blur-md flex flex-col justify-center max-w-none' : ''}`}>
      {/* Location Map Card */}
      <div className={`bg-white rounded-3xl border border-[#E2DDD5] shadow-sand-md overflow-hidden flex flex-col ${isFullscreen ? 'h-[92vh] max-w-6xl mx-auto w-full' : ''}`}>
        
        {/* Map Header / Actions Bar */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C85A40]/10 flex items-center justify-center text-[#C85A40]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-medium text-[#2A2421]">
                  {venue.name}
                </h3>
              </div>
              {area && (
                <p className="text-xs text-[#736B66]">
                  {area}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme switcher */}
            <div className="hidden sm:flex items-center bg-[#F4F1EA] p-1 rounded-xl border border-[#E2DDD5]">
              <button
                type="button"
                onClick={() => setMapTheme('editorial')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  mapTheme === 'editorial'
                    ? 'bg-white text-[#2A2421] shadow-xs'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                Editorial
              </button>
              <button
                type="button"
                onClick={() => setMapTheme('blueprint')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  mapTheme === 'blueprint'
                    ? 'bg-white text-[#2A2421] shadow-xs'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                Blueprint
              </button>
              <button
                type="button"
                onClick={() => setMapTheme('topographic')}
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  mapTheme === 'topographic'
                    ? 'bg-white text-[#2A2421] shadow-xs'
                    : 'text-[#736B66] hover:text-[#2A2421]'
                }`}
              >
                Contours
              </button>
            </div>

            {/* Expand / Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Expand map full screen'}
              className="p-2 rounded-xl bg-white border border-[#E2DDD5] text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA] transition-colors cursor-pointer shadow-xs"
              title={isFullscreen ? 'Exit fullscreen' : 'Expand map'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* The Map Interactive Canvas */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          className={`relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors ${
            isFullscreen ? 'flex-1 min-h-[460px]' : 'h-80 sm:h-96'
          } ${
            mapTheme === 'editorial'
              ? 'bg-[#EFEAE2]'
              : mapTheme === 'blueprint'
              ? 'bg-[#252C32]'
              : 'bg-[#EAE4D9]'
          }`}
        >
          {/* Animated/Interactive SVG Map Plane */}
          <div
            className="absolute inset-0 transition-transform duration-75 origin-center"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: 'center center'
            }}
          >
            {/* SVG Vector Map Rendering */}
            <svg
              className="w-full h-full min-w-[800px] min-h-[500px]"
              viewBox="0 0 1000 600"
              preserveAspectRatio="xMidYMid slice"
              xmlns="http://www.w3.org/2000/svg"
            >
              {mapTheme === 'editorial' && (
                <>
                  {/* Subtle Topographic Elevation Contours */}
                  <g fill="none" stroke="#E2DDD5" strokeWidth="1.2" opacity="0.65">
                    <ellipse cx="500" cy="300" rx="340" ry="210" />
                    <ellipse cx="480" cy="310" rx="270" ry="170" />
                    <ellipse cx="510" cy="290" rx="200" ry="120" />
                    <ellipse cx="500" cy="300" rx="130" ry="80" />
                    <path d="M 50,80 Q 250,140 450,110 T 850,180" />
                    <path d="M 120,520 Q 320,440 560,490 T 960,420" />
                  </g>

                  {/* Curving Natural River / Canal */}
                  <path
                    d="M -50,180 C 180,240 320,130 520,200 S 780,140 1050,220"
                    fill="none"
                    stroke="#D2DCDE"
                    strokeWidth="32"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  <path
                    d="M -50,180 C 180,240 320,130 520,200 S 780,140 1050,220"
                    fill="none"
                    stroke="#CAD6D9"
                    strokeWidth="8"
                    strokeDasharray="16 8"
                    opacity="0.6"
                  />

                  {/* Park / Olive Grove / Vineyard Greenery */}
                  <path
                    d="M 180,320 C 220,300 270,310 300,350 S 280,420 220,430 S 150,380 180,320 Z"
                    fill="#DDE5DC"
                    opacity="0.8"
                  />
                  <text x="215" y="375" fontSize="10" fill="#697D6B" fontFamily="serif" fontStyle="italic">
                    Park
                  </text>

                  <path
                    d="M 680,160 C 740,150 820,180 840,240 S 790,300 730,290 S 660,200 680,160 Z"
                    fill="#E2E9DF"
                    opacity="0.85"
                  />
                  <text x="730" y="230" fontSize="10" fill="#697D6B" fontFamily="serif" fontStyle="italic">
                    Green space
                  </text>

                  {/* Secondary Roads & Alleyways */}
                  <g fill="none" stroke="#E5DFD4" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M 200,-50 L 260,320 L 480,310 L 720,480" />
                    <path d="M 850,-50 L 780,280 L 520,310 L 320,550" />
                    <path d="M 100,420 L 490,315 L 900,340" />
                    <path d="M 380,80 L 510,295 L 680,80" />
                  </g>

                  {/* Primary Terracotta-tinted Arteries */}
                  <g fill="none" stroke="#FFFFFF" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M -50,340 Q 250,320 500,300 T 1050,290" />
                    <path d="M 500,-50 L 500,650" />
                  </g>
                  <g fill="none" stroke="#C85A40" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.35">
                    <path d="M -50,340 Q 250,320 500,300 T 1050,290" />
                    <path d="M 500,-50 L 500,650" />
                  </g>

                  {/* Stylized Architectural Building Footprints */}
                  <g fill="#DCD6CC" stroke="#CFC8BD" strokeWidth="1">
                    <rect x="420" y="240" width="40" height="28" rx="2" />
                    <rect x="430" y="340" width="34" height="32" rx="2" />
                    <rect x="540" y="245" width="45" height="30" rx="2" />
                    <rect x="550" y="340" width="38" height="26" rx="2" />
                    <rect x="340" y="270" width="30" height="42" rx="2" />
                    <rect x="630" y="310" width="35" height="40" rx="2" />
                  </g>

                  {/* Landmark Labels */}
                  <text x="310" y="260" fontSize="11" fill="#736B66" fontFamily="sans-serif" letterSpacing="0.05em">
                    SIDE ROAD
                  </text>
                  <text x="630" y="295" fontSize="11" fill="#736B66" fontFamily="sans-serif" letterSpacing="0.05em">
                    RIVERSIDE
                  </text>
                  <text x="515" y="440" fontSize="11" fill="#736B66" fontFamily="sans-serif" letterSpacing="0.05em">
                    ACCESS ROAD
                  </text>
                </>
              )}

              {mapTheme === 'blueprint' && (
                <>
                  {/* Blueprint Grid Lines */}
                  <defs>
                    <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#333E48" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="1000" height="600" fill="url(#blueprint-grid)" />

                  {/* Venue site circles */}
                  <g fill="none" stroke="#485B6B" strokeWidth="1.5" strokeDasharray="4 4">
                    <circle cx="500" cy="300" r="160" />
                    <circle cx="500" cy="300" r="90" />
                    <circle cx="500" cy="300" r="40" />
                  </g>

                  {/* Axial corridors */}
                  <g stroke="#617D94" strokeWidth="2">
                    <line x1="100" y1="300" x2="900" y2="300" />
                    <line x1="500" y1="50" x2="500" y2="550" />
                    <line x1="250" y1="120" x2="750" y2="480" strokeDasharray="6 4" stroke="#425869" />
                  </g>

                  {/* Structural Footprint */}
                  <rect x="440" y="250" width="120" height="100" fill="#2E3942" stroke="#87A4BC" strokeWidth="2" rx="4" />
                  <rect x="470" y="280" width="60" height="40" fill="#3D4D59" stroke="#C85A40" strokeWidth="1.5" />
                  <text x="500" y="235" textAnchor="middle" fontSize="11" fill="#A4C2DC" fontFamily="monospace">
                    VENUE
                  </text>
                </>
              )}

              {mapTheme === 'topographic' && (
                <>
                  {/* Dense Earth Contours */}
                  <g fill="none" stroke="#D3C9BD" strokeWidth="1.2">
                    <path d="M 0,100 C 300,50 600,180 1000,120" />
                    <path d="M 0,160 C 320,120 580,230 1000,190" />
                    <path d="M 0,220 C 340,190 620,280 1000,250" strokeWidth="1.8" stroke="#B8A997" />
                    <path d="M 0,280 C 360,250 640,340 1000,310" />
                    <path d="M 0,340 C 380,310 660,390 1000,370" />
                    <path d="M 0,400 C 400,370 680,450 1000,430" strokeWidth="1.8" stroke="#B8A997" />
                    <path d="M 0,460 C 420,430 700,510 1000,490" />
                  </g>
                  {/* Hill Summit Ring */}
                  <ellipse cx="500" cy="300" rx="90" ry="60" fill="#DFD6C9" stroke="#9E8D7B" strokeWidth="1.5" />
                </>
              )}

              {/* Central Target Reticle */}
              <circle
                cx="500"
                cy="300"
                r="44"
                fill="none"
                stroke="#C85A40"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.4"
              />
            </svg>

            {/* Central Venue Marker Pin */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full pointer-events-none">
              <div className="relative flex flex-col items-center">
                {/* Glowing Pulse Ring */}
                <span className="absolute -bottom-1 w-6 h-6 rounded-full bg-[#C85A40]/30 animate-ping" />
                <span className="absolute -bottom-0.5 w-4 h-4 rounded-full bg-[#C85A40]/50" />
                
                {/* Pin Shadow */}
                <div className="w-8 h-2 rounded-full bg-[#2A2421]/20 blur-xs mt-1" />

                {/* The Terracotta Teardrop Pin Marker */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPinTooltip(!showPinTooltip);
                  }}
                  className="pointer-events-auto cursor-pointer relative -mb-1 transform transition-transform hover:scale-110 active:scale-95 drop-shadow-md"
                >
                  <div className="w-10 h-10 rounded-full bg-[#C85A40] text-white flex items-center justify-center border-2 border-white shadow-lg">
                    <MapPin className="w-5 h-5 fill-white text-[#C85A40]" />
                  </div>
                  {/* Point of pin */}
                  <div className="w-2.5 h-2.5 bg-[#C85A40] rotate-45 mx-auto -mt-1.5 border-r border-b border-white" />
                </div>

                {/* Interactive Tooltip Card on the Pin */}
                {showPinTooltip && (
                  <div className="pointer-events-auto absolute bottom-14 left-1/2 -translate-x-1/2 w-64 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-[#E2DDD5] shadow-sand-lg text-left animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C85A40]">
                        {category || 'Venue'}
                      </span>
                      <span className="text-[10px] font-mono text-[#736B66]">
                        {latFormatted}
                      </span>
                    </div>

                    <h4 className="font-serif text-sm font-medium text-[#2A2421] mt-0.5 leading-snug">
                      {venue.name}
                    </h4>

                    <p className="text-[11px] text-[#736B66] mt-1 line-clamp-1">
                      {[venue.address, venue.neighborhood].filter(Boolean).join(', ') || venue.city}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-[#E2DDD5]/70 flex items-center justify-between">
                      <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                        {hasCoordinates ? 'Pinned by organizer' : 'Approximate location'}
                      </span>
                      <button
                        type="button"
                        onClick={openGoogleMaps}
                        className="text-[11px] font-medium text-[#C85A40] hover:text-[#A64831] inline-flex items-center gap-1 cursor-pointer"
                      >
                        Directions <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating Map Overlay Controls (Top Right) */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-[#E2DDD5] shadow-sand-sm p-1 flex flex-col">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}
                aria-label="Zoom in"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2A2421] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="h-px w-6 bg-[#E2DDD5] mx-auto my-0.5" />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.8, z - 0.25))}
                aria-label="Zoom out"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#2A2421] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              aria-label="Recenter map"
              className="w-9 h-9 bg-white/90 backdrop-blur-md rounded-2xl border border-[#E2DDD5] shadow-sand-sm flex items-center justify-center text-[#736B66] hover:text-[#2A2421] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
              title="Reset center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Floating Scale & Coordinates Badge (Bottom Left) */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E2DDD5] shadow-sand-sm flex items-center gap-2 text-[11px] text-[#2A2421] font-mono">
              <Compass className="w-3.5 h-3.5 text-[#C85A40]" />
              <span>{latFormatted}, {lngFormatted}</span>
            </div>

            <button
              type="button"
              onClick={handleCopyCoords}
              className="bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-[#E2DDD5] shadow-sand-sm text-[#736B66] hover:text-[#2A2421] transition-colors cursor-pointer"
              title="Copy Coordinates"
            >
              {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Drag instruction notice (brief hint) */}
          <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-[#736B66] border border-[#E2DDD5]/70 pointer-events-none">
            <Navigation className="w-3 h-3 text-[#C85A40]" />
            <span>Illustrative map · Drag to pan · Use Google Maps for directions</span>
          </div>
        </div>

        {/* Venue Information & Directions Sub-Bar */}
        <div className="p-5 sm:p-6 bg-white border-t border-[#E2DDD5] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#2A2421]">
                  {venue.address || venue.name}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAddress}
                  className="text-xs text-[#736B66] hover:text-[#2A2421] p-1 rounded-md hover:bg-[#F4F1EA] transition-colors inline-flex items-center gap-1 cursor-pointer"
                  title="Copy address"
                >
                  {copiedAddress ? (
                    <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" /> Copied
                    </span>
                  ) : (
                    <Copy className="w-3 h-3 text-[#736B66]" />
                  )}
                </button>
              </div>
              {area && (
                <p className="text-xs text-[#736B66] mt-0.5">
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
          <div className="pt-3 border-t border-[#E2DDD5]/60">
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTransitTab('arrival')}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTransitTab === 'arrival'
                    ? 'bg-[#C85A40]/10 text-[#C85A40] border border-[#C85A40]/30 font-semibold'
                    : 'text-[#736B66] hover:text-[#2A2421] bg-[#F4F1EA]'
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
                    ? 'bg-[#C85A40]/10 text-[#C85A40] border border-[#C85A40]/30 font-semibold'
                    : 'text-[#736B66] hover:text-[#2A2421] bg-[#F4F1EA]'
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
                    ? 'bg-[#C85A40]/10 text-[#C85A40] border border-[#C85A40]/30 font-semibold'
                    : 'text-[#736B66] hover:text-[#2A2421] bg-[#F4F1EA]'
                }`}
              >
                <Train className="w-3 h-3" />
                Getting there
              </button>
            </div>

            <div className="bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E2DDD5] text-xs text-[#736B66] leading-relaxed">
              {activeTransitTab === 'arrival' && (
                <p>
                  <strong className="text-[#2A2421] font-medium">From the organizer: </strong>
                  {venue.mapNote?.trim() ||
                    'Arrive early to allow time for check-in, and have your ticket code ready on your phone or printed.'}
                </p>
              )}
              {activeTransitTab === 'parking' && (
                <p>
                  <strong className="text-[#2A2421] font-medium">Parking: </strong>
                  Parking arrangements at {venue.name} are set by the venue. Check with the organizer before you travel, or use public transport or ride-hailing.
                </p>
              )}
              {activeTransitTab === 'transit' && (
                <p>
                  <strong className="text-[#2A2421] font-medium">Getting there: </strong>
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
