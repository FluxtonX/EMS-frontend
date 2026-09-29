import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const badgeVariants = cva(
  'inline-flex items-center font-medium rounded-full transition-colors select-none',
  {
    variants: {
      variant: {
        neutral: 'bg-[#F5F3FF] text-[#687086] border border-[#E5E3F2]',
        success: 'bg-[#E8F8F3] text-[#18B887] border border-[#A3E5D0]',
        warning: 'bg-[#FEF6EE] text-[#F4A261] border border-[#FADBBF]',
        danger: 'bg-[#FDF0F1] text-[#EF6B73] border border-[#FAC3C6]',
        info: 'bg-[#F0EEFE] text-[#6C5CE7] border border-[#D5D0FA]',
        primary: 'bg-[#EDE9FE] text-[#6C5CE7] border border-[#D5D0FA]',
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
            variant === 'success' && 'bg-[#18B887]',
            variant === 'warning' && 'bg-[#F4A261]',
            variant === 'danger' && 'bg-[#EF6B73]',
            variant === 'info' && 'bg-[#6C5CE7]',
            variant === 'primary' && 'bg-[#6C5CE7]',
            (!variant || variant === 'neutral') && 'bg-[#687086]'
          )}
        />
      )}
      {children}
    </span>
  );
}
