import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationVariants = cva(
  'fixed z-50 transition-all duration-300 ease-in-out rounded-2xl overflow-hidden flex flex-col w-[340px] animate-in fade-in-50 slide-in-from-left-10',
  {
    variants: {
      variant: {
        default: [
          'bg-white dark:bg-gray-900',
          'shadow-[0_8px_32px_rgba(28,60,52,0.14)]',
          'border border-gray-100 dark:border-gray-800',
        ],
        alert: [
          'bg-gradient-to-br from-amber-50 to-amber-100/60 dark:from-amber-950 dark:to-amber-900/60',
          'shadow-[0_8px_32px_rgba(188,108,37,0.18)]',
          'border border-amber-200/80 dark:border-amber-700/60',
        ],
        destructive: [
          'bg-gradient-to-br from-red-50 to-red-100/60 dark:from-red-950 dark:to-red-900/60',
          'shadow-[0_8px_32px_rgba(220,38,38,0.14)]',
          'border border-red-200/80 dark:border-red-700/60',
        ],
      },
      position: {
        topRight: 'top-4 right-4',
        topLeft: 'top-4 left-4',
        bottomRight: 'bottom-4 right-4',
        bottomLeft: 'bottom-4 left-4',
      },
    },
    defaultVariants: {
      variant: 'default',
      position: 'topLeft',
    },
  }
);

const accentVariants = cva('w-1 self-stretch rounded-full flex-shrink-0', {
  variants: {
    variant: {
      default: 'bg-primary',
      alert: 'bg-amber-500',
      destructive: 'bg-red-500',
    },
  },
  defaultVariants: { variant: 'default' },
});

const iconBadgeVariants = cva(
  'flex items-center justify-center rounded-xl w-9 h-9 flex-shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        alert: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        destructive: 'bg-red-500/10 text-red-600 dark:text-red-400',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const progressVariants = cva('h-0.5 rounded-full transition-all ease-linear', {
  variants: {
    variant: {
      default: 'bg-primary/40',
      alert: 'bg-amber-500/50',
      destructive: 'bg-red-500/50',
    },
  },
  defaultVariants: { variant: 'default' },
});

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  open?: boolean;
  title?: string;
  description?: string;
  onClose?: () => void;
  duration?: number;
}

const ICONS = {
  alert: Bell,
  destructive: AlertTriangle,
  default: CheckCircle,
} as const;

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant = 'default', position, open = true, title, description, onClose, duration = 5000, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(open);
    const [isMounted, setIsMounted] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
      if (!open || duration <= 0) return;
      setIsMounted(true);
      setProgress(100);

      const step = 100 / (duration / 50);
      const progressTimer = setInterval(() => {
        setProgress((p) => Math.max(0, p - step));
      }, 50);

      const closeTimer = setTimeout(() => setIsVisible(false), duration);

      return () => {
        clearInterval(progressTimer);
        clearTimeout(closeTimer);
      };
    }, [open, duration]);

    useEffect(() => {
      if (!isVisible && isMounted) {
        const t = setTimeout(() => onClose?.(), 300);
        return () => clearTimeout(t);
      }
    }, [isVisible, onClose, isMounted]);

    if (!open && !isMounted) return null;

    const Icon = ICONS[variant ?? 'default'];

    return (
      <div
        className={cn(
          notificationVariants({ variant, position, className }),
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        )}
        ref={ref}
        {...props}
      >
        {/* Main content row */}
        <div className="flex items-start gap-3 p-4">
          {/* Left accent stripe */}
          <div className={accentVariants({ variant })} />

          {/* Icon badge */}
          <div className={iconBadgeVariants({ variant })}>
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0 pt-0.5">
            {title && (
              <p className="text-sm font-semibold leading-tight text-foreground dark:text-foreground truncate">
                {title}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            className="flex-shrink-0 text-muted-foreground hover:text-foreground rounded-lg p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            onClick={() => setIsVisible(false)}
            aria-label="Close notification"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Progress bar */}
        {duration > 0 && (
          <div className="h-0.5 bg-black/5 dark:bg-white/10 mx-4 mb-2 rounded-full overflow-hidden">
            <div
              className={progressVariants({ variant })}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);

Notification.displayName = 'Notification';

export { Notification, notificationVariants };
