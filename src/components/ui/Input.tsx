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
            <div className="absolute left-3 flex items-center pointer-events-none text-[#687086]">
              {leftIcon}
            </div>
          )}
          <input
            id={id}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-9 rounded bg-white px-3 text-sm text-[#171A2B] placeholder:text-[#9096A9] border transition-colors outline-none',
              'focus:ring-2 focus:ring-[#6C5CE7]/20 focus:border-[#6C5CE7]',
              error ? 'border-[#EF6B73] focus:border-[#EF6B73] focus:ring-[#EF6B73]/20' : 'border-[#E5E3F2] hover:border-[#D5D0FA]',
              disabled && 'bg-[#F5F3FF] text-[#9096A9] border-[#E5E3F2] cursor-not-allowed',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center text-[#687086]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-[#EF6B73] font-medium">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-[#687086]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
