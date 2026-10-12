import React, { Suspense, lazy, useState } from 'react';
import { Crosshair, MapPin, Search, X } from 'lucide-react';
import { PlaceResult, geocodeApi, getApiErrorMessage } from '../../services/api';
import { Button } from '../ui/Button';

const VenueMap = lazy(() => import('../map/VenueMap'));

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CoordinatePickerProps {
  value: Coordinates | null;
  onChange: (value: Coordinates | null) => void;
  /** Venue name, street and town from the form, used to start the search */
  suggestedQuery: string;
}

// Where a pin starts when the organizer places it by hand: Nairobi CBD
const NAIROBI: Coordinates = { lat: -1.2864, lng: 36.8172 };

const inputClass =
  'w-full px-4 py-2.5 bg-ivory border border-[#D8CDBC] rounded-xl text-sm text-[#1E1814] placeholder-[#675A50]/60 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33]';

/** Pins the venue on the map: search for the address, pick a result, then drag the pin to the entrance. */
export const CoordinatePicker: React.FC<CoordinatePickerProps> = ({ value, onChange, suggestedQuery }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async () => {
    const q = (query || suggestedQuery).trim();
    if (q.length < 3) {
      setError('Type the venue name or street first.');
      return;
    }
    setQuery(q);
    setIsSearching(true);
    setError(null);
    try {
      const found = await geocodeApi.search(q);
      setResults(found);
      if (found.length === 1) onChange({ lat: found[0].lat, lng: found[0].lng });
    } catch (err) {
      setResults(null);
      setError(getApiErrorMessage(err, 'Address search is not available right now.'));
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <span className="text-xs font-semibold text-[#1E1814] uppercase tracking-wider block mb-1">Map pin</span>
        <p className="text-[11px] text-[#675A50]">
          Optional · search for the venue, then drag the pin to the entrance. Without a pin, attendees get the address
          and a Directions link.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            // Enter searches here instead of submitting the event form
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder={suggestedQuery || 'e.g. KICC, Harambee Avenue, Nairobi'}
          aria-label="Search for the venue address"
          className={inputClass}
        />
        <Button type="button" variant="secondary" icon={<Search className="w-4 h-4" />} onClick={runSearch} disabled={isSearching}>
          {isSearching ? 'Searching…' : 'Search'}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}

      {results && results.length > 1 && (
        <ul className="rounded-xl border border-[#D8CDBC] bg-ivory divide-y divide-[#D8CDBC] overflow-hidden" aria-label="Search results">
          {results.map((place) => (
            <li key={`${place.lat},${place.lng}`}>
              <button
                type="button"
                onClick={() => {
                  onChange({ lat: place.lat, lng: place.lng });
                  setResults(null);
                }}
                className="w-full text-left px-4 py-2.5 text-xs text-[#1E1814] hover:bg-[#E9E2D6] flex items-start gap-2 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-[#8A4F33] shrink-0 mt-0.5" />
                {place.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {results && results.length === 0 && (
        <p className="text-xs text-[#675A50]">No match found. Try the street or a landmark, or place the pin by hand.</p>
      )}

      {value ? (
        <div className="space-y-2">
          <div className="h-64 rounded-2xl overflow-hidden border border-[#D8CDBC]">
            <Suspense fallback={<div className="w-full h-full animate-shimmer" />}>
              <VenueMap
                position={value}
                zoom={16}
                onMove={onChange}
                label="Venue pin. Drag the pin or click the map to move it."
                className="w-full h-full"
              />
            </Suspense>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#675A50]">
            <span className="font-mono">
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)} · drag the pin or click the map to adjust
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="inline-flex items-center gap-1 text-[#675A50] hover:text-red-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Remove pin
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChange(NAIROBI)}
          className="text-xs text-[#8A4F33] hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <Crosshair className="w-3.5 h-3.5" /> Place the pin by hand
        </button>
      )}
    </div>
  );
};
