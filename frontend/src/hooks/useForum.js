import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createForumThread, fetchForumThreads } from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useForumThreads() {
  return useQuery({
    queryKey: queryKeys.forum.threads,
    queryFn: fetchForumThreads,
  });
}

export function useCreateForumThread() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createForumThread,
    onMutate: async (nextThread) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.forum.threads });
      const previousThreads = queryClient.getQueryData(queryKeys.forum.threads) ?? [];

      queryClient.setQueryData(queryKeys.forum.threads, [
        {
          id: `optimistic-${Date.now()}`,
          replies: 0,
          author: 'You',
          createdAt: 'Just now',
          ...nextThread,
        },
        ...previousThreads,
      ]);

      return { previousThreads };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousThreads) {
        queryClient.setQueryData(queryKeys.forum.threads, context.previousThreads);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.forum.threads });
    },
  });
}

export const useForumThreadsQuery = useForumThreads;
export const useCreateForumThreadMutation = useCreateForumThread;
