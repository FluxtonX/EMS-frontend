import React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  ({ className, label, error, helperText, id, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-[#687086] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 h-4 w-4 pointer-events-none text-[#687086]" />
          <input
            id={id}
            type="date"
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-9 rounded bg-white pl-9 pr-3 text-sm text-[#171A2B] border transition-colors outline-none cursor-pointer',
              'focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]',
              error ? 'border-[#EF6B73] focus:border-[#EF6B73]' : 'border-[#E5E3F2] hover:border-[#D5D0FA]',
              disabled && 'bg-[#F5F3FF] text-[#9096A9] border-[#E5E3F2] cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-[#EF6B73] font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#687086]">{helperText}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
