import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C5CE7] focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded select-none cursor-pointer',
  {
    variants: {
      variant: {
        primary:
          'bg-[#6C5CE7] text-white hover:bg-[#806FF0] active:bg-[#5A4ACD] shadow-xs',
        secondary:
          'bg-[#F5F3FF] text-[#171A2B] hover:bg-[#EDE9FE] border border-[#E5E3F2]',
        outline:
          'bg-white text-[#171A2B] border border-[#E5E3F2] hover:bg-[#F5F3FF] hover:border-[#D5D0FA]',
        destructive:
          'bg-[#EF6B73] text-white hover:bg-[#E0535B] active:bg-[#C93B43] shadow-xs',
        ghost:
          'text-[#687086] hover:bg-[#F5F3FF] hover:text-[#171A2B]',
        link:
          'text-[#6C5CE7] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        xs: 'h-7 px-2 text-xs gap-1',
        sm: 'h-8 px-3 text-xs gap-1.5',
        md: 'h-9 px-4 text-sm gap-2',
        lg: 'h-10 px-5 text-sm gap-2.5',
        icon: 'h-9 w-9 p-0',
        'icon-sm': 'h-7 w-7 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
