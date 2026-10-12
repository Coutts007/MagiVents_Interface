import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * OpenStreetMap tiles through Leaflet. Tile URL and attribution follow the OSM tile usage policy
 * (operations.osmfoundation.org/policies/tiles/): the standard HTTPS URL and a visible credit.
 * Loaded on demand (React.lazy), so Leaflet is not part of the main bundle.
 */
export const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface VenueMapProps {
  position: LatLng;
  zoom?: number;
  /** When set, the pin can be dragged (or the map clicked) to move it */
  onMove?: (position: LatLng) => void;
  /** Accessible description of the map */
  label: string;
  /** Text in the pin's popup */
  popup?: string;
  className?: string;
  /** Changes when the map's container is resized (e.g. full screen), so Leaflet can re-measure */
  sizeKey?: string | number | boolean;
}

// The brand pin, drawn as SVG so no marker image files are needed
const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true" style="filter: drop-shadow(0 3px 4px rgba(30,24,20,.35))">
    <path d="M17 1C8.2 1 1 8 1 16.7 1 28.6 17 43 17 43s16-14.4 16-26.3C33 8 25.8 1 17 1z" fill="#8A4F33" stroke="#F4EFE7" stroke-width="2"/>
    <circle cx="17" cy="16.5" r="5.5" fill="#F4EFE7"/></svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 43],
  popupAnchor: [0, -38]
});

const VenueMap: React.FC<VenueMapProps> = ({ position, zoom = 15, onMove, label, popup, className = '', sizeKey }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  // Create the map once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { center: [position.lat, position.lng], zoom, scrollWheelZoom: false });
    L.tileLayer(OSM_TILE_URL, { maxZoom: 19, attribution: OSM_ATTRIBUTION }).addTo(map);
    const marker = L.marker([position.lat, position.lng], {
      icon: pinIcon,
      draggable: Boolean(onMoveRef.current),
      keyboard: true,
      title: label,
      alt: label
    }).addTo(map);
    if (popup) marker.bindPopup(popup);
    marker.on('dragend', () => {
      const { lat, lng } = marker.getLatLng();
      onMoveRef.current?.({ lat, lng });
    });
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!onMoveRef.current) return;
      marker.setLatLng(e.latlng);
      onMoveRef.current({ lat: e.latlng.lat, lng: e.latlng.lng });
    });
    // Scroll-wheel zoom only once the map has focus, so the page still scrolls past it
    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow position changes from outside (e.g. an address search result)
  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const current = marker.getLatLng();
    if (current.lat !== position.lat || current.lng !== position.lng) {
      marker.setLatLng([position.lat, position.lng]);
      map.setView([position.lat, position.lng], Math.max(map.getZoom(), zoom));
    }
  }, [position.lat, position.lng, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const timer = setTimeout(() => map.invalidateSize(), 50);
    return () => clearTimeout(timer);
  }, [sizeKey]);

  return <div ref={containerRef} role="region" aria-label={label} className={`z-0 ${className}`} />;
};

export default VenueMap;
