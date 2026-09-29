import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  label?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, helperText, label, id, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-[#475569] mb-1">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            id={id}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-9 rounded bg-white px-3 pr-8 text-sm text-[#0F172A] border transition-colors outline-none appearance-none cursor-pointer',
              'focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]',
              error ? 'border-[#DC2626] focus:border-[#DC2626]' : 'border-[#CBD5E1] hover:border-[#94A3B8]',
              disabled && 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 h-4 w-4 pointer-events-none text-[#64748B]" />
        </div>
        {error && <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
