import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = 'default', showLabel = false, size = 'default', ...props }, ref) => (
  <div className="flex items-center gap-3 w-full">
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-full bg-slate-800/80 w-full',
        size === 'sm' && 'h-1',
        size === 'default' && 'h-2',
        size === 'lg' && 'h-3',
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          'h-full w-full flex-1 transition-all duration-500 ease-out rounded-full',
          variant === 'default' && 'bg-blue-500',
          variant === 'gradient' && 'bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500',
          variant === 'success' && 'bg-emerald-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'danger' && 'bg-rose-500',
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
    {showLabel && (
      <span className="text-xs font-medium text-slate-400 tabular-nums w-8 shrink-0 text-right">
        {Math.round(value || 0)}%
      </span>
    )}
  </div>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
