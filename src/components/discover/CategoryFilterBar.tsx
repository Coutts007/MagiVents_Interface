import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { CATEGORY_DEFINITIONS } from '../../data/categories';
import { CategoryIcon } from '../ui/CategoryIcon';

export interface CategoryFilterBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  onTagClick?: (tag: string) => void;
  activeTag?: string;
  onClearTag?: () => void;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  onTagClick,
  activeTag,
  onClearTag
}) => {
  const activeDef = CATEGORY_DEFINITIONS.find((c) => c.id === selectedCategory);
  const [categoryQuery, setCategoryQuery] = useState('');

  // "All" and the selected category always stay visible while searching
  const query = categoryQuery.trim().toLowerCase();
  const visibleCategories = CATEGORY_DEFINITIONS.filter(
    (cat) =>
      !query ||
      cat.id === 'all' ||
      cat.id === selectedCategory ||
      [cat.label, cat.shortLabel, cat.tagline, cat.description].some((text) => text.toLowerCase().includes(query))
  );
  const hasMatches = !query || visibleCategories.some((cat) => cat.id !== 'all' && cat.id !== selectedCategory);

  return (
    <div className="w-full space-y-4">
      {/* Category search */}
      <div className="relative w-full sm:max-w-xs">
        <Search className="w-3.5 h-3.5 text-[#675A50] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          value={categoryQuery}
          onChange={(e) => setCategoryQuery(e.target.value)}
          placeholder="Search categories, e.g. tech, sports"
          aria-label="Search categories"
          className="w-full pl-9 pr-8 py-2 bg-ivory border border-[#D8CDBC] rounded-full text-xs text-[#1E1814] placeholder-[#675A50]/70 focus:outline-none focus:border-[#8A4F33] focus:ring-1 focus:ring-[#8A4F33] transition-colors"
        />
        {categoryQuery && (
          <button
            type="button"
            onClick={() => setCategoryQuery('')}
            aria-label="Clear category search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#675A50] hover:text-[#1E1814] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Category Pills Slider / Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
        {visibleCategories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = cat.id === 'all'
            ? Object.values(categoryCounts).reduce((a, b) => a + b, 0)
            : (categoryCounts[cat.id] || 0);

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-medium transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 select-none shrink-0 ${
                isSelected
                  ? 'bg-[#8A4F33] text-white shadow-sand-md ring-2 ring-[#8A4F33]/20'
                  : 'bg-ivory text-[#675A50] border border-[#D8CDBC] hover:border-[#675A50] hover:text-[#1E1814] shadow-sand-sm'
              }`}
            >
              <CategoryIcon category={cat.id} className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-[#8A4F33]'}`} />
              <span className="font-medium">{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                  isSelected
                    ? 'bg-ivory/20 text-white'
                    : 'bg-[#E9E2D6] text-[#675A50] border border-[#D8CDBC]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
        {!hasMatches && (
          <span className="text-xs text-[#675A50] px-2 whitespace-nowrap">No matching category</span>
        )}
      </div>

      {/* Category banner when a specific category is active */}
      {activeDef && activeDef.id !== 'all' && (
        <div className="bg-[#EFE8DD] rounded-2xl p-5 border border-[#D8CDBC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-widest font-bold text-[#8A4F33]">
                Category
              </span>
              <span className="text-[#D8CDBC]">·</span>
              <span className="text-xs text-[#675A50]">
                {categoryCounts[activeDef.id] || 0} {(categoryCounts[activeDef.id] || 0) === 1 ? 'event' : 'events'}
              </span>
            </div>
            <h3 className="font-serif text-lg font-medium text-[#1E1814]">
              {activeDef.tagline}
            </h3>
            <p className="text-xs text-[#675A50] max-w-2xl leading-relaxed">
              {activeDef.description}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeTag && onClearTag && (
              <button
                onClick={onClearTag}
                className="inline-flex items-center gap-1 text-xs text-[#8A4F33] bg-[#8A4F33]/10 px-3 py-1.5 rounded-full border border-[#8A4F33]/20 hover:bg-[#8A4F33]/20 transition-colors"
              >
                <span>Tag: #{activeTag}</span>
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => onSelectCategory('all')}
              className="text-xs text-[#675A50] hover:text-[#1E1814] px-3 py-1.5 rounded-full border border-[#D8CDBC] hover:bg-ivory bg-ivory/60 transition-colors cursor-pointer"
            >
              Show all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
