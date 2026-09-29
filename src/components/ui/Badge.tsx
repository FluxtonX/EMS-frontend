import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full transition-colors select-none',
  {
    variants: {
      variant: {
        neutral: 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]',
        success: 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]',
        warning: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
        danger: 'bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]',
        info: 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]',
        primary: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]',
      },
      size: {
        sm: 'px-2 py-0.5 text-[11px] gap-1',
        md: 'px-2.5 py-0.5 text-xs gap-1.5',
      },
    },
    defaultVariants: {
      variant: 'neutral',
      size: 'sm',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-[#16A34A]',
            variant === 'warning' && 'bg-[#D97706]',
            variant === 'danger' && 'bg-[#DC2626]',
            variant === 'info' && 'bg-[#0284C7]',
            variant === 'primary' && 'bg-[#2563EB]',
            (!variant || variant === 'neutral') && 'bg-[#64748B]'
          )}
        />
      )}
      {children}
    </span>
  );
}
