import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-ivory rounded-3xl border border-[#D8CDBC] overflow-hidden p-3 shadow-sand-sm flex flex-col h-full">
      {/* Image Skeleton */}
      <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden animate-shimmer">
        <div className="absolute top-3 left-3 w-24 h-6 rounded-full bg-ivory/40" />
      </div>

      {/* Content Skeleton */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-20 h-3 rounded-full animate-shimmer" />
            <span className="text-[#D8CDBC]">·</span>
            <div className="w-16 h-3 rounded-full animate-shimmer" />
          </div>

          {/* Title */}
          <div className="h-6 w-3/4 rounded-md mb-2 animate-shimmer" />
          <div className="h-6 w-1/2 rounded-md mb-4 animate-shimmer" />

          {/* Description lines */}
          <div className="space-y-2 mb-6">
            <div className="h-3 w-full rounded animate-shimmer" />
            <div className="h-3 w-5/6 rounded animate-shimmer" />
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="pt-4 border-t border-[#D8CDBC]/70 flex items-center justify-between">
          <div className="h-4 w-20 rounded animate-shimmer" />
          <div className="h-8 w-24 rounded-full animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, idx) => (
        <SkeletonCard key={idx} />
      ))}
    </div>
  );
};
