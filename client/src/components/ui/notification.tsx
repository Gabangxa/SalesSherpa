import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const notificationVariants = cva(
  "fixed shadow-lg rounded-lg border p-4 w-96 transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
  {
    variants: {
      variant: {
        default: "bg-background border",
        alert: "bg-amber-50 border-amber-200 text-amber-900",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
      position: {
        topRight: "top-4 right-4",
        topLeft: "top-4 left-4", 
        bottomRight: "bottom-4 right-4",
        bottomLeft: "bottom-4 left-4",
      }
    },
    defaultVariants: {
      variant: "default",
      position: "topRight",
    },
  }
)

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
  ({ className, variant, position, open = true, title, description, onClose, duration = 5000, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);
    
    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    React.useEffect(() => {
      if (isOpen && duration > 0) {
        const timeout = setTimeout(() => {
          setIsOpen(false);
          if (onClose) onClose();
        }, duration);
        
        return () => clearTimeout(timeout);
      }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant, position, className }))}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            {title && <div className="font-semibold text-sm">{title}</div>}
            {description && <div className="text-sm opacity-90 mt-1">{description}</div>}
          </div>
          <button
            className="rounded-full h-5 w-5 inline-flex items-center justify-center text-foreground/60 hover:text-foreground"
            onClick={() => {
              setIsOpen(false);
              if (onClose) onClose();
            }}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    )
  }
)
Notification.displayName = "Notification"

export { Notification }