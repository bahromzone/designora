import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchNotifications,
  markNotificationRead,
} from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.inbox,
    queryFn: fetchNotifications,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (notifications) => {
      queryClient.setQueryData(queryKeys.notifications.inbox, notifications);
    },
  });
}

export const useNotificationsQuery = useNotifications;
export const useMarkNotificationReadMutation = useMarkNotificationRead;
