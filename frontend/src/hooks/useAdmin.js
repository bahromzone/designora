import { useQuery } from '@tanstack/react-query';
import { fetchAdminDashboard } from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useAdminDashboard() {
  return useQuery({
    queryKey: queryKeys.admin.dashboard,
    queryFn: fetchAdminDashboard,
  });
}
