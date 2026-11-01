import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/apiClient';

export function useAdminSummary() {
  return useQuery({ queryKey: ['admin', 'summary'], queryFn: async () => (await apiClient.get('/admin/analytics/summary')).data });
}

export function useAdminUsers() {
  return useQuery({ queryKey: ['admin', 'users'], queryFn: async () => (await apiClient.get('/admin/users')).data.users });
}

export function usePendingExecutors() {
  return useQuery({
    queryKey: ['admin', 'executors', 'pending'],
    queryFn: async () => (await apiClient.get('/admin/executors/pending')).data.executors,
  });
}

export function useVerifyExecutor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      (await apiClient.patch(`/admin/executors/${id}/verify`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'executors', 'pending'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

export function useAdminOrders() {
  return useQuery({ queryKey: ['admin', 'orders'], queryFn: async () => (await apiClient.get('/admin/orders')).data.orders });
}

export function useLiveOrders() {
  return useQuery({
    queryKey: ['admin', 'orders', 'live'],
    queryFn: async () => (await apiClient.get('/admin/orders/live')).data.orders,
    refetchInterval: 15000,
  });
}
