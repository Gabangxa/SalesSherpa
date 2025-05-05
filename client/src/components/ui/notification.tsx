import React, { useEffect, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const notificationVariants = cva(
  'fixed transition-all duration-300 ease-in-out shadow-lg rounded-lg p-4 flex flex-col gap-1',
  {
    variants: {
      variant: {
        default: 'bg-background border text-foreground',
        alert: 'bg-amber-100 border-amber-300 text-amber-800',
        destructive: 'bg-destructive border-destructive text-destructive-foreground',
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
      position: 'topRight',
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
          <div className="flex-1">
            {title && <h3 className="font-medium">{title}</h3>}
            {description && (
              <div className="text-sm mt-1">{description}</div>
            )}
          </div>
          <button
            className="text-foreground/70 hover:text-foreground p-1 rounded-full hover:bg-muted ml-2"
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