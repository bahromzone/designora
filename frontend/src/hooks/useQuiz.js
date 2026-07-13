import { useQuery } from '@tanstack/react-query';
import { fetchQuizSummary } from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useQuizSummary() {
  return useQuery({
    queryKey: queryKeys.learning.quizSummary,
    queryFn: fetchQuizSummary,
  });
}

export const useQuizSummaryQuery = useQuizSummary;
