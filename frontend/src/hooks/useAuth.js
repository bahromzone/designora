import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile } from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: fetchProfile,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.auth.profile, profile);
    },
  });
}
