import React, { useState, useEffect } from 'react';
import { EventItem, EventCategory } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { ImageUploadZone } from '../ui/ImageUploadZone';

export interface EventEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventItem) => void;
  eventToEdit: EventItem | null;
}

const PRESET_IMAGES = [
  { label: 'Symphony Hall', url: '/src/assets/images/hero_symphony_hall_1790418903594.jpg' },
  { label: 'Culinary Table', url: '/src/assets/images/event_culinary_pairing_1790418917631.jpg' },
  { label: 'Nordic Architecture', url: '/src/assets/images/event_contemporary_design_1790418929050.jpg' },
  { label: 'Olive Grove Acoustic', url: '/src/assets/images/event_acoustic_retreat_1790418942685.jpg' }
];

export const EventEditorModal: React.FC<EventEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  eventToEdit
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('Music & Performance');
  const [date, setDate] = useState('');
  const [isoDate, setIsoDate] = useState('2026-10-25');
  const [time, setTime] = useState('19:00 — 22:00');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [venueCity, setVenueCity] = useState('');
  const [startingPrice, setStartingPrice] = useState(85);
  const [capacity, setCapacity] = useState(100);
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostRole, setHostRole] = useState('');
  const [curatorNote, setCuratorNote] = useState('');
  const [tags, setTags] = useState('Acoustic, Cultural, Evening');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setSubtitle(eventToEdit.subtitle);
      setCategory(eventToEdit.category);
      setDate(eventToEdit.date);
      setIsoDate(eventToEdit.isoDate);
      setTime(eventToEdit.time);
      setVenueName(eventToEdit.venue.name);
      setVenueAddress(eventToEdit.venue.address);
      setVenueCity(eventToEdit.venue.city);
      setStartingPrice(eventToEdit.pricing.startingPrice);
      setCapacity(eventToEdit.capacity);
      setImageUrl(eventToEdit.imageUrl);
      setDescription(eventToEdit.description);
      setHostName(eventToEdit.host.name);
      setHostRole(eventToEdit.host.role);
      setCuratorNote(eventToEdit.curatorNote || '');
      setTags(eventToEdit.tags.join(', '));
    } else {
      // Defaults for new event
      setTitle('');
      setSubtitle('');
      setCategory('Music & Performance');
      setDate('Saturday, Nov 28, 2026');
      setIsoDate('2026-11-28');
      setTime('19:30 — 22:30');
      setVenueName('');
      setVenueAddress('');
      setVenueCity('');
      setStartingPrice(95);
      setCapacity(120);
      setImageUrl(PRESET_IMAGES[0].url);
      setDescription('');
      setHostName('');
      setHostRole('Artistic Lead');
      setCuratorNote('');
      setTags('Intimate, Curated, Craft');
    }
  }, [eventToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !venueName.trim()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const savedItem: EventItem = {
      id: eventToEdit ? eventToEdit.id : `event-${Date.now()}`,
      title,
      subtitle: subtitle || 'An extraordinary sensory gathering',
      category,
      description: description || 'A curated evening celebrating material warmth and focused artistic expression.',
      fullContent: description || 'Every detail of this gathering has been tailored for intimate presence and acoustic clarity.',
      date: date || 'Saturday, Nov 28, 2026',
      isoDate: isoDate || '2026-11-28',
      time: time || '19:00 — 22:00',
      venue: {
        name: venueName,
        address: venueAddress || '12 Artisan Courtyard',
        city: venueCity || 'Provence Basin',
        neighborhood: 'Old Quarter'
      },
      pricing: {
        currency: '$',
        startingPrice: Number(startingPrice) || 50,
        tiers: eventToEdit
          ? eventToEdit.pricing.tiers
          : [
              {
                id: `tier-standard-${Date.now()}`,
                name: 'General Admission',
                price: Number(startingPrice) || 50,
                description: 'Full program access and welcome infusion.',
                available: Number(capacity) || 100,
                perks: ['Welcome botanical drink', 'Print program', 'Open seating']
              }
            ]
      },
      capacity: Number(capacity) || 100,
      attendeeCount: eventToEdit ? eventToEdit.attendeeCount : 0,
      imageUrl,
      host: {
        name: hostName || 'Curatorial Collective',
        role: hostRole || 'Artistic Lead',
        bio: 'Devoted to staging intentional gatherings in architecturally resonant spaces.'
      },
      agenda: eventToEdit?.agenda || [
        { time: '19:00', title: 'Arrival & Welcome Pour', detail: 'Guests arrive and receive botanical infusions.' },
        { time: '19:45', title: 'Main Program Commences', detail: 'Focused performance and discussion.' },
        { time: '21:30', title: 'Reception & Salon', detail: 'Communal discussion with the host.' }
      ],
      status: eventToEdit ? eventToEdit.status : 'published',
      isFeatured: eventToEdit ? eventToEdit.isFeatured : false,
      tags: parsedTags.length > 0 ? parsedTags : ['Curated', 'Gathering'],
      curatorNote
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={eventToEdit ? 'Edit Gathering' : 'Curate a New Gathering'}
      subtitle="Publish an intimate cultural experience on MagiVents."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title & Subtitle */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Gathering Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Nocturne in the Cloister: Cello & Candlelight"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40] focus:ring-1 focus:ring-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Deck / Subtitle
            </label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., A one-night chamber acoustic experience under vaulted stone"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40] focus:ring-1 focus:ring-[#C85A40]"
            />
          </div>
        </div>

        {/* Category & Date Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            >
              <option value="Culinary & Wine">Culinary & Wine</option>
              <option value="Architecture & Design">Architecture & Design</option>
              <option value="Fine Arts & Craft">Fine Arts & Craft</option>
              <option value="Music & Performance">Music & Performance</option>
              <option value="Literature & Thought">Literature & Thought</option>
              <option value="Gatherings & Salons">Gatherings & Salons</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Date Display Text
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="e.g., Saturday, Nov 28, 2026"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>
        </div>

        {/* Schedule & Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Schedule / Hours
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="19:00 — 22:30"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              ISO Date (For sorting)
            </label>
            <input
              type="date"
              value={isoDate}
              onChange={(e) => setIsoDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>
        </div>

        {/* Venue Information */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Venue Name *
            </label>
            <input
              type="text"
              required
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Palais des Papes Courtyard"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Address
            </label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="Place du Palais"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              City / Region
            </label>
            <input
              type="text"
              value={venueCity}
              onChange={(e) => setVenueCity(e.target.value)}
              placeholder="Avignon, France"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>
        </div>

        {/* Pricing & Capacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Starting Price ($)
            </label>
            <input
              type="number"
              min="0"
              value={startingPrice}
              onChange={(e) => setStartingPrice(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Maximum Capacity (Seats)
            </label>
            <input
              type="number"
              min="1"
              max="500"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>
        </div>

        {/* Image Selection & File Upload */}
        <div className="pt-1">
          <ImageUploadZone
            label="Editorial Artwork Theme & Visual Identity *"
            helperText="Upload event photography or select an atelier preset"
            value={imageUrl}
            onChange={(newUrl) => setImageUrl(newUrl)}
            aspectRatio="16:9"
            shape="rounded"
            presets={PRESET_IMAGES}
            maxDimension={{ width: 1920, height: 1080 }}
            uploadButtonText="Upload Editorial Artwork File"
            allowUrlInput={true}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
            Curatorial Description & Philosophy
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the intention, materiality, and sensory atmosphere of this edition..."
            className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
          />
        </div>

        {/* Host Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Host / Presenter Name
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g., Julien Mercier"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#2A2421] uppercase tracking-wider block mb-1">
              Tags (Comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Acoustic, Wine, Architecture"
              className="w-full px-4 py-2.5 bg-white border border-[#E2DDD5] rounded-xl text-sm text-[#2A2421] focus:outline-none focus:border-[#C85A40]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-[#E2DDD5] flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {eventToEdit ? 'Save Modifications' : 'Publish Gathering'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
