import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
  transparent?: boolean;
}

/**
 * Loading component to be used throughout the application
 * for consistent loading states
 */
const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ 
    size = 'md', 
    text,
    fullPage = false,
    transparent = false,
    className,
    ...props 
  }, ref) => {
    const sizeMap = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12'
    };

    const containerClasses = cn(
      'flex flex-col items-center justify-center',
      fullPage && 'fixed inset-0 z-50',
      !transparent && fullPage && 'bg-background/80',
      className
    );

    return (
      <div 
        ref={ref} 
        className={containerClasses}
        {...props}
      >
        <Loader2 
          className={cn(
            'animate-spin text-primary',
            sizeMap[size]
          )}
        />
        {text && (
          <p className={cn(
            'mt-2 text-muted-foreground',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base'
          )}>
            {text}
          </p>
        )}
      </div>
    );
  }
);

Loading.displayName = 'Loading';

export { Loading };

/**
 * Component for section/card loading states
 */
export function SectionLoading() {
  return (
    <div className="p-8 flex justify-center items-center">
      <Loading size="md" text="Loading..." />
    </div>
  );
}

/**
 * Component for inline loading (to be used inline with text/content)
 */
export function InlineLoading() {
  return (
    <Loader2 className="h-4 w-4 animate-spin inline-block ml-2 text-primary" />
  );
}

/**
 * Component for full page loading overlay
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <Loading fullPage size="lg" text={text} />
  );
}