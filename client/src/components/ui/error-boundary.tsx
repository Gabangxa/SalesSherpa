import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { processError, ErrorType, logError, getUserFriendlyMessage } from '@/lib/errorService';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKey?: any; // Component will reset when this key changes
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component that catches and displays errors in a user-friendly way
 * 
 * This component:
 * - Catches errors in any descendant components
 * - Prevents the entire app from crashing
 * - Shows a user-friendly error message
 * - Allows users to retry or report the error
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Process the error
    const processedError = processError(error, {
      componentStack: errorInfo.componentStack,
    });
    
    // Log the error
    logError(processedError);
    
    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset the error state when resetKey changes
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRefresh = () => {
    // Reset the error state
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Use a custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Otherwise use our default fallback UI
      const error = this.state.error;
      const processedError = error ? processError(error) : null;
      
      // Check if this is an authentication error
      const isAuthError = processedError?.type === 'Authentication Error' || 
                         processedError?.status === 401 ||
                         error?.message?.toLowerCase().includes('unauthorized');

      if (isAuthError) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <Alert className="max-w-md border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800">Session Expired</AlertTitle>
              <AlertDescription className="text-amber-700">
                <div className="space-y-4">
                  <p>Your session has expired. Please log in again to continue.</p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.location.href = '/auth'} 
                      size="sm"
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      Go to Login
                    </Button>
                    <Button 
                      onClick={this.handleRefresh} 
                      variant="outline" 
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        );
      }
      const errorMessage = processedError ? getUserFriendlyMessage(processedError) : 'Something went wrong.';
      const isNetworkError = processedError?.type === ErrorType.NETWORK;

      return (
        <div className="relative p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 shadow-sm">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={this.handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {isNetworkError ? 'Try Again' : 'Reload Component'}
            </Button>

            {!isNetworkError && (
              <Button 
                variant="default" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * A higher-order component that wraps a component with an ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const displayName = Component.displayName || Component.name || 'Component';
  
  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
  
  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;