import React from 'react';
import { cn } from '@/lib/utils';

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-[#E5E3F2] bg-white shadow-[0_1px_4px_rgba(108,92,231,0.07)]">
      <table className={cn('w-full caption-bottom text-sm text-[#171A2B]', className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-[#FAFAFA] border-b border-[#E5E3F2]',
        className
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-[#F0EEF8]', className)} {...props} />;
}

export function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn('bg-[#FAFAFA] border-t border-[#E5E3F2] font-medium', className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors duration-100',
        'hover:bg-[#F9F8FF]',
        'data-[state=selected]:bg-[#EDE9FE]',
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
        'h-9 px-4 text-left align-middle',
        'text-[10px] font-semibold text-[#9096A9] uppercase tracking-widest',
        'select-none whitespace-nowrap',
        className
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-sm text-[#171A2B] whitespace-nowrap', className)}
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
  const startItem =
    totalItems !== undefined && pageSize !== undefined
      ? (currentPage - 1) * pageSize + 1
      : undefined;
  const endItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-t border-[#E5E3F2] bg-[#FAFAFA] text-xs text-[#687086] rounded-b-xl',
        className
      )}
    >
      <div>
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined ? (
          <span>
            Showing <span className="font-semibold text-[#171A2B]">{startItem}</span> –{' '}
            <span className="font-semibold text-[#171A2B]">{endItem}</span> of{' '}
            <span className="font-semibold text-[#171A2B]">{totalItems}</span>
          </span>
        ) : (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={cn(
            'h-7 px-2.5 rounded-lg border border-[#E5E3F2] bg-white text-xs font-medium text-[#171A2B]',
            'hover:bg-[#F5F3FF] hover:border-[#D5D0FA] transition-colors',
            'active:shadow-[inset_0_1px_3px_rgba(108,92,231,0.12)]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={cn(
            'h-7 px-2.5 rounded-lg border border-[#E5E3F2] bg-white text-xs font-medium text-[#171A2B]',
            'hover:bg-[#F5F3FF] hover:border-[#D5D0FA] transition-colors',
            'active:shadow-[inset_0_1px_3px_rgba(108,92,231,0.12)]',
            'disabled:opacity-40 disabled:cursor-not-allowed'
          )}
        >
          Next
        </button>
      </div>
    </div>
  );
}


