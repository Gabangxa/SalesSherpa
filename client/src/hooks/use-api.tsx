import { 
  useQuery, 
  useMutation, 
  UseMutationResult, 
  UseQueryResult, 
  QueryKey, 
  QueryFunctionContext 
} from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
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
  } = {}
): UseQueryResult<T, Error> {
  const { 
    enabled = true, 
    refetchInterval, 
    staleTime,
    queryKey = [],
  } = options;

  // Use the full endpoint as the first part of the query key
  const fullQueryKey = [endpoint, ...queryKey];

  return useQuery<T, Error>({
    queryKey: fullQueryKey as unknown as QueryKey,
    queryFn: async ({ signal }: QueryFunctionContext) => {
      try {
        const response = await apiRequest('GET', endpoint, undefined, { signal });
        return await response.json() as T;
      } catch (error) {
        throw handleApiError(error);
      }
    },
    enabled,
    refetchInterval,
    staleTime,
  });
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
  } = {}
): UseMutationResult<T, Error, V> {
  const { onSuccess, onError, onSettled, invalidateQueries = [] } = options;

  return useMutation<T, Error, V>({
    mutationFn: async (data: V) => {
      try {
        const response = await apiRequest(method, endpoint, method !== 'DELETE' ? data : undefined);
        
        // For DELETE, don't try to parse JSON if there's no content
        if (method === 'DELETE' && response.status === 204) {
          return null as unknown as T;
        }
        
        return await response.json() as T;
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