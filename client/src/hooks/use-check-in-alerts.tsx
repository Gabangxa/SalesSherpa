import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { CheckInAlert } from '@shared/schema';
import { z } from 'zod';

export function useCheckInAlerts() {
  const { toast } = useToast();
  const [selectedAlert, setSelectedAlert] = useState<CheckInAlert | null>(null);

  const {
    data: alerts = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/check-in-alerts'],
    retry: 1,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: Omit<CheckInAlert, 'id'>) => {
      const res = await apiRequest('POST', '/api/check-in-alerts', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alert Created',
        description: 'Your check-in alert has been successfully created.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/check-in-alerts'] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating alert',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<CheckInAlert> & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/check-in-alerts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Alert Updated',
        description: 'Your check-in alert has been successfully updated.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/check-in-alerts'] });
      setSelectedAlert(null);
    },
    onError: (error) => {
      toast({
        title: 'Error updating alert',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/check-in-alerts/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Alert Deleted',
        description: 'Your check-in alert has been successfully deleted.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/check-in-alerts'] });
      setSelectedAlert(null);
    },
    onError: (error) => {
      toast({
        title: 'Error deleting alert',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    alerts,
    isLoading,
    error,
    refetch,
    selectedAlert,
    setSelectedAlert,
    createAlertMutation,
    updateAlertMutation,
    deleteAlertMutation,
  };
}