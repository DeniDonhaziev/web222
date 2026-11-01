import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export function useCreateComplaint() {
  return useMutation({
    mutationFn: async (input: { orderId: string; subject: string; description: string }) =>
      (await apiClient.post('/complaints', input)).data,
  });
}
