import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Bell, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationVariants = cva(
  'fixed z-50 transition-all duration-300 ease-in-out shadow-xl rounded-lg p-4 flex flex-col gap-1 min-w-[300px] border border-l-4 animate-in fade-in-50 slide-in-from-left-10',
  {
    variants: {
      variant: {
        default: 'bg-white text-foreground border-primary',
        alert: 'bg-amber-50 border-amber-500 text-amber-900 font-medium',
        destructive: 'bg-red-50 border-red-500 text-red-900',
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

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  open?: boolean;
  title?: string;
  description?: string;
  onClose?: () => void;
  duration?: number;  // Duration in ms before auto-closing
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      variant,
      position,
      open = true,
      title,
      description,
      onClose,
      duration = 5000,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(open);
    const [isMounted, setIsMounted] = useState(false);

    // Handle auto-close timer
    useEffect(() => {
      if (open && duration > 0) {
        setIsMounted(true);
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, duration);

        return () => clearTimeout(timer);
      }
    }, [open, duration]);

    // Handle animation and unmounting
    useEffect(() => {
      if (!isVisible && isMounted) {
        const timer = setTimeout(() => {
          if (onClose) onClose();
        }, 300); // Match the CSS transition duration
        
        return () => clearTimeout(timer);
      }
    }, [isVisible, onClose, isMounted]);

    // If not open, don't render
    if (!open && !isMounted) return null;

    return (
      <div
        className={cn(
          notificationVariants({ variant, position, className }),
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        ref={ref}
        {...props}
      >
        <div className="flex justify-between items-start w-full">
          <div className="flex items-start gap-3">
            {variant === 'alert' && (
              <Bell className="h-6 w-6 mt-0.5 text-amber-600" />
            )}
            {variant === 'destructive' && (
              <AlertTriangle className="h-6 w-6 mt-0.5 text-red-600" />
            )}
            {variant === 'default' && (
              <CheckCircle className="h-6 w-6 mt-0.5 text-primary" />
            )}
            <div className="flex-1">
              {title && <h3 className="font-semibold text-base">{title}</h3>}
              {description && (
                <div className="text-sm mt-1">{description}</div>
              )}
            </div>
          </div>
          <button
            className="text-foreground/70 hover:text-foreground p-1.5 rounded-full hover:bg-muted/30 ml-2"
            onClick={() => setIsVisible(false)}
            aria-label="Close notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }
);

Notification.displayName = 'Notification';

export { Notification, notificationVariants };