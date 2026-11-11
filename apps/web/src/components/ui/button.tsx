import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40',
        destructive: 'bg-rose-600/80 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20',
        outline:
          'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:border-white/20',
        secondary:
          'bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 border border-white/5',
        ghost: 'text-slate-400 hover:bg-white/8 hover:text-slate-200',
        link: 'text-blue-400 underline-offset-4 hover:underline hover:text-blue-300',
        gradient:
          'bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 text-white shadow-lg shadow-violet-600/30 hover:shadow-violet-500/50 hover:opacity-95',
        glass:
          'bg-white/8 backdrop-blur-md border border-white/10 text-slate-200 hover:bg-white/12 hover:border-white/20',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        xl: 'h-13 rounded-xl px-8 text-base font-semibold',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7 rounded-md',
        'icon-lg': 'h-11 w-11 rounded-xl',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
