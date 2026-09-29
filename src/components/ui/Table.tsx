import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded border border-[#E5E3F2] bg-white">
      <table className={cn('w-full caption-bottom text-sm text-[#171A2B]', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-[#F5F3FF] border-b border-[#E5E3F2]', className)} {...props} />;
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-[#F0EEF8]', className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn('bg-[#F5F3FF] border-t border-[#E5E3F2] font-medium', className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-[#F5F3FF]/80 data-[state=selected]:bg-[#EDE9FE]',
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
        'h-10 px-4 text-left align-middle text-xs font-semibold text-[#687086] uppercase tracking-wider select-none',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('p-4 align-middle text-sm text-[#171A2B] whitespace-nowrap', className)}
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
    <div className={cn('flex items-center justify-between px-4 py-3 border-t border-[#E5E3F2] bg-white text-xs text-[#687086]', className)}>
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <span className="font-medium text-[#171A2B]">{startItem}</span> to{' '}
            <span className="font-medium text-[#171A2B]">{endItem}</span> of{' '}
            <span className="font-medium text-[#171A2B]">{totalItems}</span> results
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>
      <div className="flex items-center space-x-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="h-8 px-2.5 rounded border border-[#E5E3F2] bg-white text-xs font-medium text-[#171A2B] hover:bg-[#F5F3FF] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="h-8 px-2.5 rounded border border-[#E5E3F2] bg-white text-xs font-medium text-[#171A2B] hover:bg-[#F5F3FF] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
