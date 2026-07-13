import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCourseDraft, saveCourseDraft } from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useCourseDraft(courseId = 'draft') {
  return useQuery({
    queryKey: queryKeys.courses.draft(courseId),
    queryFn: fetchCourseDraft,
  });
}

export function useSaveCourseDraft(courseId = 'draft') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveCourseDraft,
    onSuccess: (courseDraft) => {
      queryClient.setQueryData(queryKeys.courses.draft(courseId), courseDraft);
    },
  });
}
