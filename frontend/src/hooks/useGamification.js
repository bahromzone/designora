import { useQuery } from '@tanstack/react-query';
import { fetchGamificationStats } from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useGamification() {
  return useQuery({
    queryKey: queryKeys.gamification.stats,
    queryFn: fetchGamificationStats,
  });
}

export const useGamificationQuery = useGamification;
