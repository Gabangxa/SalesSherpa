/**
 * API Service
 * 
 * A centralized service for making API requests with consistent error handling,
 * caching, and configuration.
 */
import { processError, ErrorType, handleApiError } from './errorService';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT = 10000;

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Configuration for all API requests
interface ApiRequestConfig extends RequestInit {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

// API response with status and data
interface ApiResponse<T> {
  status: number;
  data: T;
  headers: Headers;
}

/**
 * Enhanced fetch with timeout, error handling, and retries
 * 
 * @param url API endpoint URL
 * @param config Request configuration
 * @returns Promise with the response
 */
export async function fetchWithTimeout<T>(
  url: string,
  config: ApiRequestConfig = {}
): Promise<ApiResponse<T>> {
  // Configure request parameters
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = 0,
    retryDelay = 1000,
    ...fetchConfig
  } = config;
  
  // Set up timer for request timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  try {
    // Add abort signal to fetch config
    const fetchConfigWithSignal = {
      ...fetchConfig,
      signal: controller.signal,
      headers: {
        ...apiService.defaultHeaders, // Use headers from apiService
        ...fetchConfig.headers,
      },
    };
    
    try {
      // Make the API request
      const response = await fetch(url, fetchConfigWithSignal);
      
      // Handle HTTP errors
      if (!response.ok) {
        // Attempt to parse error response
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
        
        const errorMessage = errorData.message || `HTTP error ${response.status}`;
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = errorData;
        throw error;
      }
      
      // Parse response data
      let responseData;
      const contentType = response.headers.get('Content-Type') || '';
      
      if (contentType.includes('application/json')) {
        responseData = await response.json();
      } else if (contentType.includes('text/')) {
        responseData = await response.text();
      } else {
        responseData = await response.blob();
      }
      
      // Return structured API response
      return {
        status: response.status,
        data: responseData as T,
        headers: response.headers,
      };
    } catch (error) {
      // Handle request errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      // Check if retries are available
      if (retries > 0) {
        // Delay before retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        // Attempt a retry with one less retry count
        return fetchWithTimeout<T>(url, {
          ...config,
          retries: retries - 1,
          retryDelay: retryDelay * 1.5, // Exponential backoff
        });
      }
      
      // No retries left, throw the error
      throw error;
    }
  } finally {
    // Clean up timeout
    clearTimeout(timeoutId);
  }
}

/**
 * Main API service with methods for different request types
 */
export const apiService = {
  // Default headers for all requests
  defaultHeaders: DEFAULT_HEADERS,
  
  /**
   * Set CSRF token for API requests
   * 
   * @param token CSRF token from the server
   */
  setCsrfToken(token: string): void {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      'X-CSRF-Token': token
    };
  },
  /**
   * Make a GET request
   * 
   * @param url API endpoint
   * @param config Additional request configuration
   * @returns Promise with typed response data
   */
  async get<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    try {
      const response = await fetchWithTimeout<T>(url, {
        method: 'GET',
        ...config,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Make a POST request
   * 
   * @param url API endpoint
   * @param data Request body data
   * @param config Additional request configuration
   * @returns Promise with typed response data
   */
  async post<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    try {
      const response = await fetchWithTimeout<T>(url, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Make a PUT request
   * 
   * @param url API endpoint
   * @param data Request body data
   * @param config Additional request configuration
   * @returns Promise with typed response data
   */
  async put<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    try {
      const response = await fetchWithTimeout<T>(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Make a PATCH request
   * 
   * @param url API endpoint
   * @param data Request body data
   * @param config Additional request configuration
   * @returns Promise with typed response data
   */
  async patch<T>(url: string, data?: any, config?: ApiRequestConfig): Promise<T> {
    try {
      const response = await fetchWithTimeout<T>(url, {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Make a DELETE request
   * 
   * @param url API endpoint
   * @param config Additional request configuration
   * @returns Promise with typed response data
   */
  async delete<T>(url: string, config?: ApiRequestConfig): Promise<T> {
    try {
      const response = await fetchWithTimeout<T>(url, {
        method: 'DELETE',
        ...config,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
  
  /**
   * Upload a file or form data
   * 
   * @param url API endpoint
   * @param formData Form data with files
   * @param config Additional request configuration
   * @returns Promise with typed response data
   */
  async upload<T>(url: string, formData: FormData, config?: ApiRequestConfig): Promise<T> {
    try {
      // For file uploads, don't set Content-Type (browser sets it with boundary)
      const headers: Record<string, string> = {
        ...(config?.headers || {}),
      };
      delete headers['Content-Type'];
      
      const response = await fetchWithTimeout<T>(url, {
        method: 'POST',
        body: formData,
        headers,
        ...config,
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export default apiService;