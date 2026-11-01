import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export function useCreatePayment() {
  return useMutation({
    mutationFn: async (orderId: string) => (await apiClient.post('/payments/create', { orderId })).data,
  });
}

export function useMockConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => (await apiClient.post(`/payments/mock-confirm/${orderId}`)).data,
    onSuccess: (_data, orderId) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', orderId] });
    },
  });
}
