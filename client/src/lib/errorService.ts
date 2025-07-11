/**
 * Centralized error handling service
 * 
 * This service provides utilities for consistent error handling,
 * processing, and reporting throughout the application.
 */

// Different error types the app can encounter
export enum ErrorType {
  API = 'API Error',
  NETWORK = 'Network Error',
  VALIDATION = 'Validation Error',
  AUTH = 'Authentication Error',
  NOT_FOUND = 'Not Found Error',
  SERVER = 'Server Error',
  UNKNOWN = 'Unknown Error',
  WEBSOCKET = 'WebSocket Error',
  TIMEOUT = 'Timeout Error',
}

// Error severity levels
export enum ErrorSeverity {
  FATAL = 'fatal',  // App can't continue, requires reload/restart
  ERROR = 'error',  // Critical error but app can continue
  WARNING = 'warning',  // Non-critical issue
  INFO = 'info',    // Informational error
}

// Interface for processed error objects
export interface ProcessedError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  status?: number;
  timestamp: number;
  originalError?: unknown;
  details?: Record<string, unknown>;
  isHandled?: boolean;
}

// Log an error with proper formatting and context
export function logError(error: ProcessedError): void {
  // Different logging based on severity
  if (error.severity === ErrorSeverity.FATAL || error.severity === ErrorSeverity.ERROR) {
    console.error(
      `[${error.type}] ${error.message}`,
      error.details ? { details: error.details } : '',
      error.originalError || ''
    );
  } else if (error.severity === ErrorSeverity.WARNING) {
    console.warn(
      `[${error.type}] ${error.message}`,
      error.details ? { details: error.details } : ''
    );
  } else {
    console.info(
      `[${error.type}] ${error.message}`,
      error.details ? { details: error.details } : ''
    );
  }
}

// Process errors into a consistent format
export function processError(error: unknown, additionalInfo?: Record<string, unknown>): ProcessedError {
  let processedError: ProcessedError;

  // Process error into a standardized format based on type
  if (error instanceof Error) {
    const errorMessage = error.message || 'An error occurred';

    // Check for network errors
    if (errorMessage.includes('network') || 
        errorMessage.includes('Network') || 
        errorMessage.toLowerCase().includes('internet') ||
        !navigator.onLine) {
      processedError = {
        ...error,
        name: 'NetworkError',
        type: ErrorType.NETWORK,
        severity: ErrorSeverity.WARNING,
        message: 'Network connection issue. Please check your internet connection.',
        timestamp: Date.now(),
        originalError: error,
      };
    } 
    // Check for timeout errors
    else if (errorMessage.toLowerCase().includes('timeout') || 
             errorMessage.toLowerCase().includes('timed out')) {
      processedError = {
        ...error,
        name: 'TimeoutError',
        type: ErrorType.TIMEOUT,
        severity: ErrorSeverity.WARNING,
        message: 'The request timed out. Please try again.',
        timestamp: Date.now(),
        originalError: error,
      };
    }
    // Handle authentication errors
    else if (errorMessage.toLowerCase().includes('unauthorized') || 
             errorMessage.toLowerCase().includes('authentication') ||
             (error as any).status === 401) {
      processedError = {
        ...error,
        name: 'AuthenticationError',
        type: ErrorType.AUTH,
        severity: ErrorSeverity.WARNING, // Changed to warning to prevent complete app crash
        message: 'Your session has expired. Please log in again.',
        timestamp: Date.now(),
        originalError: error,
        status: 401,
      };
    }
    // Handle validation errors
    else if (errorMessage.toLowerCase().includes('validation') || 
             errorMessage.toLowerCase().includes('invalid') || 
             (error as any).status === 400) {
      processedError = {
        ...error,
        name: 'ValidationError',
        type: ErrorType.VALIDATION,
        severity: ErrorSeverity.WARNING,
        message: 'There was an issue with the data provided. Please check your inputs.',
        timestamp: Date.now(),
        originalError: error,
      };
    }
    // Handle not found errors
    else if (errorMessage.toLowerCase().includes('not found') || 
             (error as any).status === 404) {
      processedError = {
        ...error,
        name: 'NotFoundError',
        type: ErrorType.NOT_FOUND,
        severity: ErrorSeverity.WARNING,
        message: 'The requested resource was not found.',
        timestamp: Date.now(),
        originalError: error,
      };
    }
    // Handle server errors
    else if ((error as any).status >= 500) {
      processedError = {
        ...error,
        name: 'ServerError',
        type: ErrorType.SERVER,
        severity: ErrorSeverity.ERROR,
        message: 'The server encountered an error. Please try again later.',
        timestamp: Date.now(),
        originalError: error,
      };
    }
    // Default case for other Error instances
    else {
      processedError = {
        ...error,
        name: error.name || 'ApplicationError',
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.ERROR,
        message: errorMessage,
        timestamp: Date.now(),
        originalError: error,
      };
    }
  } 
  // For non-Error objects
  else {
    let errorMessage = 'An unknown error occurred';
    let status: number | undefined = undefined;
    
    // Try to extract message and status if possible
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, any>;
      errorMessage = errorObj.message || errorObj.error || errorMessage;
      status = errorObj.status || errorObj.statusCode || undefined;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    processedError = {
      name: 'ApplicationError',
      message: errorMessage,
      type: ErrorType.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      timestamp: Date.now(),
      originalError: error,
      status,
    } as ProcessedError;
  }
  
  // Add any additional info to the error
  if (additionalInfo) {
    processedError.details = {
      ...processedError.details,
      ...additionalInfo,
    };
  }
  
  return processedError;
}

// Handle API-specific errors from fetch responses
export function handleApiError(error: unknown): Error {
  // Process the error
  const processedError = processError(error);
  
  // Log it
  logError(processedError);
  
  // Mark that we've handled this error
  processedError.isHandled = true;
  
  // Return for propagation
  return processedError;
}

// Global error handler for unexpected errors
export function setupGlobalErrorHandler() {
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const processedError = processError(event.reason, {
      type: 'unhandledRejection',
      at: new Date().toISOString(),
    });
    
    logError(processedError);
    
    // We could also send these to a monitoring service here
  });
  
  // Capture uncaught exceptions
  window.addEventListener('error', (event) => {
    const processedError = processError(event.error || event.message, {
      type: 'uncaughtException',
      at: new Date().toISOString(),
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    
    logError(processedError);
    
    // We could also send these to a monitoring service here
  });
}

// Combine or present multiple errors
export function combineErrors(errors: Error[]): Error {
  if (errors.length === 0) {
    return new Error('No errors provided');
  }
  
  if (errors.length === 1) {
    return errors[0];
  }
  
  const messages = errors.map((err, index) => `${index + 1}. ${err.message}`);
  const combinedMessage = `Multiple errors occurred:\n${messages.join('\n')}`;
  
  return new Error(combinedMessage);
}

// Create a user-friendly error message
export function getUserFriendlyMessage(error: ProcessedError): string {
  switch (error.type) {
    case ErrorType.NETWORK:
      return 'Network connection issue. Please check your internet connection and try again.';
    
    case ErrorType.VALIDATION:
      return 'There was an issue with the information provided. Please check your inputs and try again.';
    
    case ErrorType.AUTH:
      return 'Your session may have expired. Please log in again.';
    
    case ErrorType.NOT_FOUND:
      return 'The requested information could not be found.';
    
    case ErrorType.SERVER:
      return 'The server encountered an issue. Please try again later.';
    
    case ErrorType.TIMEOUT:
      return 'The request took too long to complete. Please try again.';
    
    case ErrorType.WEBSOCKET:
      return 'Connection issue. Real-time updates may be delayed.';
    
    default:
      return 'Something went wrong. Please try again or contact support if the problem persists.';
  }
}