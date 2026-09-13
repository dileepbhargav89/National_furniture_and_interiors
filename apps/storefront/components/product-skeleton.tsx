'use client';

export function ProductSkeleton() {
  return (
    <div className="group block animate-pulse">
      <div className="overflow-hidden bg-transparent transition-all duration-300">
        <div className="relative aspect-[4/5] bg-gray-200" />
        <div className="pt-4 pb-2 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mt-2" />
        </div>
      </div>
    </div>
  );
}
