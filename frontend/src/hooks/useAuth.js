import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchProfile,
  loginUser,
  registerUser,
  updateProfile,
} from '../lib/mockIntegrationsApi';
import { queryKeys } from '../lib/queryKeys';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: fetchProfile,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: loginUser,
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: registerUser,
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

export const useProfileQuery = useProfile;
export const useLoginMutation = useLogin;
export const useRegisterMutation = useRegister;
export const useUpdateProfileMutation = useUpdateProfile;
