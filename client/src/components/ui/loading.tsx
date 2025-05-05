import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Define variants for the loading component
const loadingVariants = cva(
  'animate-spin text-muted-foreground',
  {
    variants: {
      size: {
        default: 'h-5 w-5',
        sm: 'h-4 w-4',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Props for inline LoadingSpinner component
interface LoadingSpinnerProps extends VariantProps<typeof loadingVariants> {
  className?: string;
}

/**
 * Inline spinner component for showing loading state within UI elements
 */
export function LoadingSpinner({ size, className }: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn(loadingVariants({ size }), className)} />
  );
}

// Props for full LoadingOverlay component
interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  fullScreen?: boolean;
  transparent?: boolean;
  spinnerSize?: VariantProps<typeof loadingVariants>['size'];
  className?: string;
}

/**
 * Loading overlay that covers a section or entire screen during loading
 */
export function LoadingOverlay({
  isLoading,
  text = 'Loading...',
  fullScreen = false,
  transparent = false,
  spinnerSize = 'lg',
  className,
}: LoadingOverlayProps) {
  const [show, setShow] = useState(false);
  
  // Add a small delay before showing the loading indicator to prevent flicker
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => setShow(true), 300);
    } else {
      setShow(false);
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading]);
  
  if (!isLoading && !show) return null;
  
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        fullScreen ? 'fixed inset-0 z-50' : 'absolute inset-0 z-10',
        transparent 
          ? 'bg-background/60 backdrop-blur-sm' 
          : 'bg-background/95',
        className
      )}
    >
      <LoadingSpinner size={spinnerSize} className="text-primary" />
      {text && (
        <p className="mt-3 text-sm font-medium text-muted-foreground">{text}</p>
      )}
    </div>
  );
}

// Props for LoadingButton component
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: VariantProps<typeof loadingVariants>['size'];
}

/**
 * Wrapper for buttons to show loading state with spinner
 */
export function LoadingButton({
  isLoading,
  children,
  className,
  spinnerSize = 'sm',
}: LoadingButtonProps) {
  return (
    <div className={cn('relative inline-flex items-center', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
          <LoadingSpinner size={spinnerSize} />
        </div>
      )}
    </div>
  );
}

// Props for LoadingContainer component
interface LoadingContainerProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Container that shows children or fallback based on loading state
 */
export function LoadingContainer({
  isLoading,
  children,
  fallback,
  delay = 300,
  className,
}: LoadingContainerProps) {
  const [showLoading, setShowLoading] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (isLoading) {
      timeout = setTimeout(() => setShowLoading(true), delay);
    } else {
      setShowLoading(false);
    }
    
    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading, delay]);
  
  return (
    <div className={className}>
      {(isLoading && showLoading) ? (
        fallback || (
          <div className="flex items-center justify-center p-6">
            <LoadingSpinner size="lg" className="text-primary" />
          </div>
        )
      ) : (
        children
      )}
    </div>
  );
}

// Props for LoadingSkeleton component
interface LoadingSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader component for content placeholders
 */
export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div 
      className={cn(
        'animate-pulse rounded-md bg-muted/50', 
        className
      )} 
    />
  );
}

/**
 * Full-page loading component for initial application loading
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
      <LoadingSpinner size="xl" className="text-primary" />
      <p className="mt-4 text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  );
}

// Default export for simplicity
export default LoadingSpinner;