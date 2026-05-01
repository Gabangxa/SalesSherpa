import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import type { AlertHistory } from '@shared/schema';

export function useAlertHistory() {
  const { user } = useAuth();

  const { data: history = [], isLoading } = useQuery<AlertHistory[]>({
    queryKey: ['/api/alert-history'],
    enabled: !!user,
    refetchInterval: 30000,
  });

  return { history, isLoading };
}
