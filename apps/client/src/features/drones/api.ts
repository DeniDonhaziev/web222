import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DroneInput } from '@drone/shared';
import { apiClient } from '../../lib/apiClient';

export function useDrones() {
  return useQuery({
    queryKey: ['drones'],
    queryFn: async () => (await apiClient.get('/drones')).data.drones,
  });
}

export function useCreateDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: DroneInput) => (await apiClient.post('/drones', input)).data.drone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drones'] }),
  });
}

export function useUpdateDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<DroneInput> & { id: string; status?: string }) =>
      (await apiClient.patch(`/drones/${id}`, input)).data.drone,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drones'] }),
  });
}

export function useDeleteDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/drones/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drones'] }),
  });
}
