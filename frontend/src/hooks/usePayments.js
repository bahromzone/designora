import { useMutation } from '@tanstack/react-query';
import { submitCheckout } from '../lib/mockIntegrationsApi';

export function useSubmitCheckout() {
  return useMutation({
    mutationFn: submitCheckout,
  });
}

export const useSubmitCheckoutMutation = useSubmitCheckout;
