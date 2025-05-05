import { 
  useQuery, 
  useMutation, 
  useSuspenseQuery,
  UseMutationResult, 
  UseQueryResult, 
  UseQueryOptions,
  UseSuspenseQueryOptions,
  QueryKey, 
  QueryFunctionContext 
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { apiService } from '@/lib/apiService';
import { handleApiError } from '@/lib/errorService';
import { useState, useEffect } from 'react';

/**
 * Custom hook for making API get requests
 * 
 * @param endpoint API endpoint to fetch
 * @param options Additional react-query options
 * @returns UseQueryResult with typed data
 */
export function useApiQuery<T>(
  endpoint: string,
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
    queryKey?: string[];
    retry?: number | boolean;
    retryDelay?: number;
    keepPreviousData?: boolean;
    suspense?: boolean;
  } = {}
): UseQueryResult<T, Error> {
  const { 
    enabled = true, 
    refetchInterval, 
    staleTime,
    queryKey = [],
    retry = 3,
    retryDelay = 1000,
    keepPreviousData = false,
    suspense = false,
  } = options;

  // Use the full endpoint as the first part of the query key
  const fullQueryKey = [endpoint, ...queryKey];

  // Create a query options object
  const queryOptions: UseQueryOptions<T, Error, T, QueryKey> = {
    queryKey: fullQueryKey as unknown as QueryKey,
    queryFn: async ({ signal }: QueryFunctionContext) => {
      try {
        // Use the apiService to handle the request
        return await apiService.get<T>(endpoint, {
          signal,
          // Configure retry at the service level
          retries: typeof retry === 'number' ? retry : retry ? 3 : 0,
          retryDelay: retryDelay,
        });
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled,
    refetchInterval,
    staleTime,
    retry,
    retryDelay,
    suspense,
  };

  // React Query v5 removed keepPreviousData, we need to conditionally add it to avoid type errors
  if (keepPreviousData) {
    // @ts-ignore - keepPreviousData might not be in the type definitions, but the library might still support it
    queryOptions.keepPreviousData = true;
  }

  return useQuery<T, Error>(queryOptions);
}

/**
 * Suspense version of useApiQuery that doesn't return loading states
 * To be used with React.Suspense
 */
export function useSuspenseApiQuery<T>(
  endpoint: string,
  options: {
    queryKey?: string[];
    staleTime?: number;
  } = {}
): T {
  const { queryKey = [], staleTime } = options;
  
  // Use the full endpoint as the first part of the query key
  const fullQueryKey = [endpoint, ...queryKey];
  
  return useSuspenseQuery<T>({
    queryKey: fullQueryKey as unknown as QueryKey,
    queryFn: async ({ signal }: QueryFunctionContext) => {
      try {
        return await apiService.get<T>(endpoint, { signal });
      } catch (error) {
        throw handleApiError(error);
      }
    },
    staleTime,
  }).data;
}

/**
 * Custom hook for making API mutations (create, update, delete)
 * 
 * @param endpoint API endpoint for the mutation
 * @param method HTTP method to use
 * @param options Additional react-query mutation options
 * @returns UseMutationResult with typed data
 */
export function useApiMutation<T, V>(
  endpoint: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE' = 'POST',
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
    invalidateQueries?: string[];
    retry?: number | boolean;
    retryDelay?: number;
  } = {}
): UseMutationResult<T, Error, V> {
  const { 
    onSuccess, 
    onError, 
    onSettled, 
    invalidateQueries = [],
    retry = 1,
    retryDelay = 1000
  } = options;

  return useMutation<T, Error, V>({
    mutationFn: async (data: V) => {
      try {
        // Use the appropriate apiService method based on the HTTP method
        switch (method) {
          case 'POST':
            return await apiService.post<T>(endpoint, data, {
              retries: typeof retry === 'number' ? retry : retry ? 1 : 0,
              retryDelay
            });
          case 'PUT':
            return await apiService.put<T>(endpoint, data, {
              retries: typeof retry === 'number' ? retry : retry ? 1 : 0,
              retryDelay
            });
          case 'PATCH':
            return await apiService.patch<T>(endpoint, data, {
              retries: typeof retry === 'number' ? retry : retry ? 1 : 0,
              retryDelay
            });
          case 'DELETE':
            return await apiService.delete<T>(endpoint, {
              retries: typeof retry === 'number' ? retry : retry ? 1 : 0,
              retryDelay
            });
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries when the mutation is successful
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] as unknown as QueryKey });
        });
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError,
    onSettled,
    retry,
    retryDelay
  });
}

/**
 * Custom hook for file uploads
 * 
 * @param endpoint API endpoint for the upload
 * @param options Additional react-query mutation options
 * @returns UseMutationResult with typed data
 */
export function useApiUpload<T>(
  endpoint: string,
  options: {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
    invalidateQueries?: string[];
  } = {}
): UseMutationResult<T, Error, FormData> {
  const { onSuccess, onError, onSettled, invalidateQueries = [] } = options;

  return useMutation<T, Error, FormData>({
    mutationFn: async (formData: FormData) => {
      try {
        return await apiService.upload<T>(endpoint, formData);
      } catch (error) {
        throw handleApiError(error);
      }
    },
    onSuccess: (data) => {
      // Invalidate related queries when the mutation is successful
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach(query => {
          queryClient.invalidateQueries({ queryKey: [query] as unknown as QueryKey });
        });
      }
      
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onError,
    onSettled,
  });
}

/**
 * Hook for handling loading states with a delay to prevent flicker
 * 
 * @param loading The current loading state
 * @param delayMs Delay in milliseconds before showing loading state
 * @returns Delayed loading state
 */
export function useDelayedLoading(loading: boolean, delayMs = 300): boolean {
  const [delayedLoading, setDelayedLoading] = useState(false);
  
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (loading) {
      timeout = setTimeout(() => {
        setDelayedLoading(true);
      }, delayMs);
    } else {
      setDelayedLoading(false);
    }
    
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [loading, delayMs]);
  
  return delayedLoading;
}

/**
 * Hook for debouncing a value
 * 
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}