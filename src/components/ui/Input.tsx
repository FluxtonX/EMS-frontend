import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, helperText, leftIcon, rightIcon, disabled, id, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-[#64748B]">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-9 rounded bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] border transition-colors outline-none',
              'focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]',
              error ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20' : 'border-[#CBD5E1] hover:border-[#94A3B8]',
              disabled && 'bg-[#F8FAFC] text-[#94A3B8] border-[#E2E8F0] cursor-not-allowed',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-[#64748B]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-[#DC2626] font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
