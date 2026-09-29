import React from 'react';
import { cn } from '@/lib/utils';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon = <FolderOpen className="h-8 w-8 text-[#94A3B8]" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded border border-dashed border-[#CBD5E1] bg-[#F8FAFC]',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-[#E2E8F0] mb-3 shadow-2xs">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-[#0F172A]">{title}</h3>
      {description && <p className="mt-1 text-xs text-[#64748B] max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
