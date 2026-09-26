import React from 'react';
import {
  Compass,
  UtensilsCrossed,
  Building2,
  Palette,
  Music,
  BookOpen,
  Sparkles,
  X
} from 'lucide-react';
import { EventCategory, CategoryDefinition } from '../../types';
import { CATEGORY_DEFINITIONS } from '../../data/mockEvents';

export interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  onTagClick?: (tag: string) => void;
  activeTag?: string;
  onClearTag?: () => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Compass,
  UtensilsCrossed,
  Building2,
  Palette,
  Music,
  BookOpen,
  Sparkles
};

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onTagClick,
  activeTag,
  onClearTag
}) => {
  const activeDef = CATEGORY_DEFINITIONS.find((c) => c.id === selectedCategory);

  return (
    <div className="w-full space-y-4">
      {/* Category Pills Slider / Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
        {CATEGORY_DEFINITIONS.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = CATEGORY_ICONS[cat.iconName] || Compass;
          const count = cat.id === 'all'
            ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
            : (categoryCounts[cat.id] || 0);

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 select-none shrink-0 ${
                isSelected
                  ? 'bg-[#C85A40] text-white shadow-sand-md ring-2 ring-[#C85A40]/20'
                  : 'bg-white text-[#736B66] border border-[#E2DDD5] hover:border-[#736B66] hover:text-[#2A2421] shadow-sand-sm'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#C85A40]'}`} />
              <span className="font-medium">{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F4F1EA] text-[#736B66] border border-[#E2DDD5]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Curatorial Header Banner when a specific category is active */}
      {activeDef && activeDef.id !== 'all' && (
        <div className="bg-[#FAF8F5] rounded-2xl p-5 border border-[#E2DDD5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-[#C85A40]">
                Curated Category
              </span>
              <span className="text-[#E2DDD5]">·</span>
              <span className="text-xs text-[#736B66]">
                {categoryCounts[activeDef.id] || 0} Scheduled Gatherings
              </span>
            </div>
            <h3 className="font-serif text-lg font-medium text-[#2A2421]">
              {activeDef.tagline}
            </h3>
            <p className="text-xs text-[#736B66] max-w-2xl leading-relaxed">
              {activeDef.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTag && onClearTag && (
              <button
                onClick={onClearTag}
                className="inline-flex items-center gap-1 text-xs text-[#C85A40] bg-[#C85A40]/10 px-3 py-1.5 rounded-full border border-[#C85A40]/20 hover:bg-[#C85A40]/20 transition-colors"
              >
                <span>Tag: #{activeTag}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs text-[#736B66] hover:text-[#2A2421] px-3 py-1.5 rounded-full border border-[#E2DDD5] hover:bg-white bg-white/60 transition-colors cursor-pointer"
            >
              Reset to All
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
