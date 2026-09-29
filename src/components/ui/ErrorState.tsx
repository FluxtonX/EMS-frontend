import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to load data. Please check your connection and try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded border border-[#FECACA] bg-[#FEF2F2]',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white border border-[#FCA5A5] mb-3 text-[#DC2626]">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-semibold text-[#991B1B]">{title}</h3>
      <p className="mt-1 text-xs text-[#B91C1C] max-w-sm">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
          className="mt-4 border-[#FCA5A5] text-[#991B1B] hover:bg-white"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
