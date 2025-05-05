import { queryClient } from '@/lib/queryClient';

// Error types to categorize different errors
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

// Structure for API errors
export interface ApiError {
  type: ErrorType;
  message: string;
  status?: number;
  details?: Record<string, any>;
  originalError?: any;
}

/**
 * Categorizes an error based on status code or message
 */
export function categorizeError(error: any): ErrorType {
  if (!error) return ErrorType.UNKNOWN;

  // Check if it's a network error
  if (!navigator.onLine || error.message?.includes('network') || error.message?.includes('connect')) {
    return ErrorType.NETWORK;
  }

  // Get status code if available
  const status = error.status || error.statusCode || (error.response && error.response.status);

  if (status) {
    if (status === 401) return ErrorType.AUTHENTICATION;
    if (status === 403) return ErrorType.AUTHORIZATION;
    if (status === 404) return ErrorType.NOT_FOUND;
    if (status >= 400 && status < 500) return ErrorType.VALIDATION;
    if (status >= 500) return ErrorType.SERVER;
  }

  // Check error message for clues
  const message = error.message || '';
  if (message.includes('unauthorized') || message.includes('unauthenticated') || message.includes('login')) {
    return ErrorType.AUTHENTICATION;
  }
  if (message.includes('permission') || message.includes('forbidden')) {
    return ErrorType.AUTHORIZATION;
  }
  if (message.includes('not found') || message.includes('404')) {
    return ErrorType.NOT_FOUND;
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return ErrorType.VALIDATION;
  }

  return ErrorType.UNKNOWN;
}

/**
 * Processes an error and returns a standardized ApiError
 */
export function processError(error: any): ApiError {
  const type = categorizeError(error);
  
  // Get HTTP status if available
  const status = error.status || error.statusCode || (error.response && error.response.status);
  
  // Get or create appropriate error message
  let message = error.message || 'An unexpected error occurred';
  if (error.response && error.response.data && error.response.data.message) {
    message = error.response.data.message;
  }

  // Create user-friendly error messages based on type
  switch (type) {
    case ErrorType.NETWORK:
      message = 'Network connection error. Please check your internet connection and try again.';
      break;
    case ErrorType.AUTHENTICATION:
      message = 'Authentication required. Please log in to continue.';
      break;
    case ErrorType.AUTHORIZATION:
      message = 'You do not have permission to perform this action.';
      break;
    case ErrorType.NOT_FOUND:
      message = 'The requested resource was not found.';
      break;
    case ErrorType.SERVER:
      message = 'Server error. Please try again later.';
      break;
  }

  // Extract additional details if available
  const details: Record<string, any> = {};
  if (error.response && error.response.data) {
    if (error.response.data.errors) {
      details.errors = error.response.data.errors;
    }
    if (error.response.data.details) {
      details.details = error.response.data.details;
    }
  }

  return {
    type,
    message,
    status,
    details: Object.keys(details).length > 0 ? details : undefined,
    originalError: error
  };
}

/**
 * Function to handle API errors globally
 */
export function handleApiError(error: any): ApiError {
  const processedError = processError(error);
  
  // Log the error for debugging
  console.error('API Error:', processedError);
  
  // Handle authentication errors by redirecting to login
  if (processedError.type === ErrorType.AUTHENTICATION) {
    // Clear any authenticated queries
    queryClient.clear();
    // Redirect to login page if not already there
    if (window.location.pathname !== '/auth') {
      window.location.href = '/auth';
    }
  }
  
  return processedError;
}

/**
 * Get a user-friendly error message from any error object
 */
export function getErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';
  
  if (typeof error === 'string') return error;
  
  if (error.message) return error.message;
  
  if (error.response && error.response.data) {
    if (error.response.data.message) return error.response.data.message;
    if (error.response.data.error) return error.response.data.error;
  }
  
  return 'An unexpected error occurred';
}

export default {
  processError,
  handleApiError,
  getErrorMessage,
  categorizeError,
  ErrorType
};