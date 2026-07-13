import { useMutation, useQuery } from '@tanstack/react-query';
import {
  fetchInstructorAnalytics,
  submitInstructorApplication,
} from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useInstructorAnalytics() {
  return useQuery({
    queryKey: queryKeys.instructor.analytics,
    queryFn: fetchInstructorAnalytics,
  });
}

export function useSubmitInstructorApplication() {
  return useMutation({
    mutationFn: submitInstructorApplication,
  });
}
