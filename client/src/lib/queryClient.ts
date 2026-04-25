import { QueryClient, QueryFunction, DefaultOptions } from "@tanstack/react-query";
import { handleApiError, processError } from "@/lib/errorService";

/**
 * Enhanced response error handling that processes the error
 * and provides more detailed information
 */
async function processResponseError(res: Response): Promise<never> {
  let errorData: any = { status: res.status, statusText: res.statusText };
  
  try {
    // Try to parse as JSON first
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      errorData = await res.clone().json();
    } else {
      // Fall back to text
      errorData.message = await res.text() || res.statusText;
    }
  } catch (e) {
    // If JSON parsing fails, use text
    try {
      errorData.message = await res.text() || res.statusText;
    } catch (textError) {
      errorData.message = res.statusText;
    }
  }
  
  // Create error object with appropriate details
  const error = new Error(errorData.message || `${res.status}: ${res.statusText}`);
  Object.assign(error, {
    status: res.status,
    statusText: res.statusText,
    data: errorData
  });
  
  throw error;
}

/**
 * Enhanced API request function with better error handling
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  config?: RequestInit
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...(data ? { "Content-Type": "application/json" } : {}),
        ...(config?.headers || {})
      },
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      ...config,
    });

    if (!res.ok) {
      await processResponseError(res);
    }
    
    return res;
  } catch (error) {
    // Process and handle the error with our error service
    const processedError = handleApiError(error);
    throw processedError;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

/**
 * Enhanced query function with better error handling and caching
 */
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    try {
      // Allow for complex query keys while ensuring first item is the URL
      const url = typeof queryKey[0] === 'string' ? queryKey[0] : '/';
      
      const res = await fetch(url, {
        credentials: "include",
        signal,
      });

      // Special handling for 404 on certain endpoints to return empty arrays/objects
      // instead of treating them as errors
      if (res.status === 404 && url.includes('/api/')) {
        // These endpoints should return empty data rather than error on 404
        if (
          url.includes('/api/goals') ||
          url.includes('/api/tasks') ||
          url.includes('/api/check-ins') ||
          url.includes('/api/check-in-alerts')
        ) {
          return [] as any;
        }
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      // For data endpoints, if user is not authenticated, return empty data instead of error
      if (res.status === 401 && url.includes('/api/')) {
        if (
          url.includes('/api/goals') ||
          url.includes('/api/tasks') ||
          url.includes('/api/check-ins') ||
          url.includes('/api/check-in-alerts')
        ) {
          return [] as any;
        }
      }

      if (!res.ok) {
        await processResponseError(res);
      }
      
      return await res.json();
    } catch (error) {
      // Process and handle the error with our error service
      const processedError = handleApiError(error);
      throw processedError;
    }
  };

// Performance-optimized query client configuration
const queryClientConfig: DefaultOptions = {
  queries: {
    queryFn: getQueryFn({ on401: "throw" }),
    refetchOnWindowFocus: import.meta.env.PROD ? false : true, // Disable in production
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime in v4)
    retry: (failureCount, error: any) => {
      // Don't retry on specific status codes
      if (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404) {
        return false;
      }
      // Retry network errors up to 3 times
      return failureCount < 3;
    },
  },
  mutations: {
    // Don't retry mutations except for network errors
    retry: (failureCount, error: any) => {
      const isNetworkError = !error.status && 
                           navigator.onLine === false || 
                           error.message?.includes('network');
      return isNetworkError && failureCount < 2;
    },
  },
};

// Export the enhanced query client
export const queryClient = new QueryClient({
  defaultOptions: queryClientConfig,
});
