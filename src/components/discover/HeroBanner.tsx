import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Calendar, MapPin, ArrowRight, Pause, Play } from 'lucide-react';
import { EventItem } from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export interface HeroBannerProps {
  events: EventItem[];
  onSelectEvent: (event: EventItem) => void;
  onQuickBook: (event: EventItem) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  events,
  onSelectEvent,
  onQuickBook
}) => {
  const featured = events.filter((e) => e.isFeatured);
  const displayEvents = featured.length > 0 ? featured : events.slice(0, 3);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % displayEvents.length);
  }, [displayEvents.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + displayEvents.length) % displayEvents.length);
  }, [displayEvents.length]);

  useEffect(() => {
    if (!isPlaying || displayEvents.length <= 1) return;
    const interval = setInterval(nextSlide, 6500);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide, displayEvents.length]);

  const currentEvent = displayEvents[currentIndex];
  if (!currentEvent) return null;

  return (
    <section
      aria-label="Featured Gatherings Carousel"
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12"
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] md:aspect-[2.4/1] min-h-[460px] sm:min-h-[500px] rounded-3xl overflow-hidden shadow-sand-xl border border-[#E2DDD5] bg-[#2A2421]">
        {/* Slide Images */}
        {displayEvents.map((event, index) => {
          const isActive = index === currentIndex;
          const hasError = imageError[event.id];

          return (
            <div
              key={event.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
            >
              {!hasError ? (
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  referrerPolicy="no-referrer"
                  onError={() => setImageError((prev) => ({ ...prev, [event.id]: true }))}
                  className="w-full h-full object-cover transform scale-100 transition-transform duration-7000 ease-out"
                />
              ) : (
                /* Fallback stylized gradient container if image fails */
                <div className="w-full h-full bg-gradient-to-br from-[#3D332D] via-[#2A2421] to-[#1F1916] flex items-center justify-center p-8">
                  <div className="text-center text-[#F4F1EA]/40">
                    <span className="font-serif text-3xl italic">{event.title}</span>
                  </div>
                </div>
              )}

              {/* Scrim Gradient Overlay for 4.5:1 text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1F1916]/95 via-[#1F1916]/55 to-black/20" />
            </div>
          );
        })}

        {/* Slide Content Overlay */}
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 sm:p-10 md:p-14 text-white">
          <div className="max-w-3xl space-y-4">
            {/* Category Badge & Curatorial Indicator */}
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="terracotta" size="md">
                {currentEvent.category}
              </Badge>
              <span className="text-xs uppercase tracking-widest text-[#F4F1EA]/80 font-medium">
                Featured Gathering · Edition 2026
              </span>
            </div>

            {/* Event Title */}
            <h1
              style={{ textWrap: 'balance' }}
              className="font-serif text-2xl sm:text-4xl md:text-5xl lg:text-5xl font-medium tracking-tight text-[#F4F1EA] leading-[1.15]"
            >
              {currentEvent.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-[#F4F1EA]/85 font-light line-clamp-2 max-w-2xl">
              {currentEvent.subtitle}
            </p>

            {/* Metadata Bar */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-[#F4F1EA]/80 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#C85A40]" />
                <span>{currentEvent.date}</span>
                <span className="text-white/40">·</span>
                <span>{currentEvent.time}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C85A40]" />
                <span className="truncate max-w-[220px]">{currentEvent.venue.name}</span>
                <span className="text-white/40">·</span>
                <span>{currentEvent.venue.city}</span>
              </div>
            </div>

            {/* CTA Group */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Button
                variant="primary"
                size="md"
                onClick={() => onQuickBook(currentEvent)}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Reserve from ${currentEvent.pricing.startingPrice}
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onSelectEvent(currentEvent)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
              >
                Curatorial Overview
              </Button>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Controls */}
        <div className="absolute top-6 right-6 z-30 hidden sm:flex items-center gap-2">
          {/* Pause/Play */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Prev */}
          <button
            onClick={prevSlide}
            aria-label="Previous slide"
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Next */}
          <button
            onClick={nextSlide}
            aria-label="Next slide"
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md transition-colors cursor-pointer border border-white/10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Indicators / Dots */}
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2">
          {displayEvents.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-8 bg-[#C85A40]' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
