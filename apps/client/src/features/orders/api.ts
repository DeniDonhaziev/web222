import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateOrderInput } from '@drone/shared';
import { apiClient } from '../../lib/apiClient';

export function useMyOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => (await apiClient.get('/orders')).data.orders,
    refetchInterval: 15000,
  });
}

export function useOpenOrders() {
  return useQuery({
    queryKey: ['orders', 'open'],
    queryFn: async () => (await apiClient.get('/orders/open/available')).data.orders,
    refetchInterval: 10000,
  });
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', orderId],
    queryFn: async () => (await apiClient.get(`/orders/${orderId}`)).data,
    enabled: !!orderId,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateOrderInput) => (await apiClient.post('/orders', input)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useMatchCandidates(orderId: string | undefined) {
  return useQuery({
    queryKey: ['orders', orderId, 'match'],
    queryFn: async () => (await apiClient.get(`/orders/${orderId}/match`)).data.candidates,
    enabled: !!orderId,
  });
}

export function useAcceptOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, droneId }: { orderId: string; droneId: string }) =>
      (await apiClient.post(`/orders/${orderId}/accept`, { droneId })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status, note, cancelReason }: { orderId: string; status: string; note?: string; cancelReason?: string }) =>
      (await apiClient.patch(`/orders/${orderId}/status`, { status, note, cancelReason })).data,
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['orders', variables.orderId] });
    },
  });
}

export function useRateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, score, comment }: { orderId: string; score: number; comment?: string }) =>
      (await apiClient.post(`/orders/${orderId}/rate`, { score, comment })).data,
    onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['orders', variables.orderId] }),
  });
}

export function useSendLocation() {
  return useMutation({
    mutationFn: async ({ orderId, lat, lng, speedKmh }: { orderId: string; lat: number; lng: number; speedKmh?: number }) =>
      (await apiClient.post(`/orders/${orderId}/location`, { lat, lng, speedKmh })).data,
  });
}
