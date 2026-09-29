import React from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded bg-[#E2E8F0]/70', className)}
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full rounded border border-[#E2E8F0] bg-white overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 bg-[#F8FAFC] border-b border-[#E2E8F0] px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="h-4 w-24" />
        ))}
      </div>
      {/* Rows Skeleton */}
      <div className="divide-y divide-[#F1F5F9]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={`row-${r}`} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={`cell-${r}-${c}`}
                className={cn('h-4', c === 0 ? 'w-36' : c === 1 ? 'w-20' : 'w-24')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 rounded border border-[#E2E8F0] bg-white space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="p-6 rounded border border-[#E2E8F0] bg-white space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#F1F5F9]">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
    </div>
  );
}
