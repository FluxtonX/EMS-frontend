import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded border border-[#E2E8F0] bg-white">
      <table className={cn('w-full caption-bottom text-sm text-[#0F172A]', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-[#F8FAFC] border-b border-[#E2E8F0]', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-[#F1F5F9]', className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn('bg-[#F8FAFC] border-t border-[#E2E8F0] font-medium', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[#F8FAFC]/80 data-[state=selected]:bg-[#EFF6FF]',
        className
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-semibold text-[#475569] uppercase tracking-wider select-none',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('p-4 align-middle text-sm text-[#0F172A] whitespace-nowrap', className)}
      {...props}
    />
  );
}

export function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}: {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const startItem = totalItems !== undefined && pageSize !== undefined ? (currentPage - 1) * pageSize + 1 : undefined;
  const endItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  return (
    <div className={cn('flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0] bg-white text-xs text-[#64748B]', className)}>
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <span className="font-medium text-[#0F172A]">{startItem}</span> to{' '}
            <span className="font-medium text-[#0F172A]">{endItem}</span> of{' '}
            <span className="font-medium text-[#0F172A]">{totalItems}</span> results
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 rounded border border-[#CBD5E1] bg-white text-xs font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
