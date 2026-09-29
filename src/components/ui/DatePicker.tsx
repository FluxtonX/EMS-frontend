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
          <label htmlFor={id} className="block text-xs font-medium text-[#475569] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <Calendar className="absolute left-3 h-4 w-4 pointer-events-none text-[#64748B]" />
          <input
            id={id}
            type="date"
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-9 rounded bg-white pl-9 pr-3 text-sm text-[#0F172A] border transition-colors outline-none cursor-pointer',
              'focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]',
              error ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#CBD5E1] hover:border-[#94A3B8]',
              disabled && 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
