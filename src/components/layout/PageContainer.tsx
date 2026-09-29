import React from 'react';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  title: string;
  subtitle?: string | React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({
  title,
  subtitle,
  breadcrumbs,
  primaryAction,
  secondaryActions,
  children,
  className,
}: PageContainerProps) {
  return (
    <div className={cn('p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5', className)}>
      {/* Top bar with Breadcrumbs */}
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E5E3F2]">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#171A2B]">{title}</h1>
          {subtitle && (
            <div className="mt-0.5 text-xs text-[#687086] flex items-center gap-2">
              {subtitle}
            </div>
          )}
        </div>

        {/* Action button slots adhering to One Primary Action rule */}
        {(primaryAction || secondaryActions) && (
          <div className="flex items-center gap-2 shrink-0">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {/* Main page content */}
      <div>{children}</div>
    </div>
  );
}
