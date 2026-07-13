import { useQuery } from '@tanstack/react-query';
import {
  fetchDashboardInsights,
  fetchStudentDashboard,
} from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useDashboardInsights() {
  return useQuery({
    queryKey: queryKeys.learning.insights,
    queryFn: fetchDashboardInsights,
  });
}

export function useStudentDashboard() {
  return useQuery({
    queryKey: queryKeys.learning.studentDashboard,
    queryFn: fetchStudentDashboard,
  });
}
