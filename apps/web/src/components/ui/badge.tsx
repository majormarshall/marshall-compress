import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
  {
    variants: {
      variant: {
        default: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
        secondary: 'bg-slate-700/60 text-slate-300 border-slate-600/40',
        success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
        warning: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
        destructive: 'bg-rose-500/15 text-rose-300 border-rose-500/25',
        violet: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
        cyan: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
        outline: 'bg-transparent border-white/15 text-slate-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-400',
            variant === 'warning' && 'bg-amber-400',
            variant === 'destructive' && 'bg-rose-400',
            variant === 'default' && 'bg-blue-400',
            variant === 'secondary' && 'bg-slate-400',
            variant === 'violet' && 'bg-violet-400',
            variant === 'cyan' && 'bg-cyan-400',
            variant === 'outline' && 'bg-slate-400',
          )}
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
