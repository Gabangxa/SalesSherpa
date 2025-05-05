import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { ErrorType, handleApiError } from '@/lib/errorService';

// Type for API responses
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

/**
 * Generic type-safe API service for making requests
 * 
 * This service abstracts away the details of making API requests and error handling,
 * providing a clean interface for the rest of the application.
 */
export class ApiService {
  /**
   * Fetch data from the API
   * @param endpoint The API endpoint to fetch from
   * @returns Promise with typed response
   */
  static async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await apiRequest('GET', endpoint);
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Create data via the API
   * @param endpoint The API endpoint to post to
   * @param data The data to send
   * @returns Promise with typed response
   */
  static async create<T, U>(endpoint: string, data: U): Promise<T> {
    try {
      const response = await apiRequest('POST', endpoint, data);
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Update data via the API
   * @param endpoint The API endpoint to update
   * @param data The data to send
   * @returns Promise with typed response
   */
  static async update<T, U>(endpoint: string, data: U): Promise<T> {
    try {
      const response = await apiRequest('PATCH', endpoint, data);
      return await response.json();
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Delete data via the API
   * @param endpoint The API endpoint for deletion
   * @returns Promise with success status
   */
  static async delete(endpoint: string): Promise<boolean> {
    try {
      await apiRequest('DELETE', endpoint);
      return true;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  /**
   * Invalidate specific query caches to refresh data
   * @param queryKeys The query keys to invalidate
   */
  static invalidateQueries(queryKeys: string | string[]): void {
    const keysArray = Array.isArray(queryKeys) ? queryKeys : [queryKeys];
    
    keysArray.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }

  /**
   * Prefetch data to improve perceived performance
   * @param endpoint The API endpoint to prefetch
   */
  static async prefetch<T>(endpoint: string): Promise<void> {
    try {
      await queryClient.prefetchQuery({
        queryKey: [endpoint],
        queryFn: async () => {
          const response = await apiRequest('GET', endpoint);
          return await response.json() as T;
        }
      });
    } catch (error) {
      // Silent fail for prefetch - just log to console
      console.error('Prefetch error:', error);
    }
  }
}

// Domain-specific API services that use the generic ApiService

/**
 * Service for Check-In related API operations
 */
export const CheckInService = {
  /**
   * Get all check-ins for the current user
   */
  getCheckIns: () => ApiService.get('/api/check-ins'),
  
  /**
   * Create a new check-in
   */
  createCheckIn: (data: any) => ApiService.create('/api/check-ins', data),
  
  /**
   * Get check-in alerts for the current user
   */
  getCheckInAlerts: () => ApiService.get('/api/check-in-alerts'),
  
  /**
   * Create a new check-in alert
   */
  createCheckInAlert: (data: any) => ApiService.create('/api/check-in-alerts', data),
  
  /**
   * Update a check-in alert
   */
  updateCheckInAlert: (id: number, data: any) => 
    ApiService.update(`/api/check-in-alerts/${id}`, data),
    
  /**
   * Delete a check-in alert
   */
  deleteCheckInAlert: (id: number) => 
    ApiService.delete(`/api/check-in-alerts/${id}`),
  
  /**
   * Invalidate the check-ins cache
   */
  invalidateCheckInsCache: () => 
    ApiService.invalidateQueries(['/api/check-ins', '/api/check-in-alerts']),
};

/**
 * Service for User related API operations
 */
export const UserService = {
  /**
   * Get the current user's profile
   */
  getCurrentUser: () => ApiService.get('/api/user'),
  
  /**
   * Update the current user's profile
   */
  updateProfile: (data: any) => ApiService.update('/api/user', data),
  
  /**
   * Invalidate the user cache
   */
  invalidateUserCache: () => ApiService.invalidateQueries('/api/user'),
};

/**
 * Service for Chat related API operations
 */
export const ChatService = {
  /**
   * Get all chat messages
   */
  getChatMessages: () => ApiService.get('/api/chat'),
  
  /**
   * Send a new chat message
   */
  sendMessage: (message: string) => 
    ApiService.create('/api/chat', { message }),
    
  /**
   * Invalidate the chat cache
   */
  invalidateChatCache: () => ApiService.invalidateQueries('/api/chat'),
};

/**
 * Export services for use throughout the application
 */
export default {
  ApiService,
  CheckInService,
  UserService,
  ChatService,
};