import { useMutation, useQuery } from '@tanstack/react-query';
import type { ExecutorType, UserRole } from '@drone/shared';
import { apiClient } from '../../lib/apiClient';
import { useAuthStore, type AuthUser } from './authStore';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  executorType?: ExecutorType;
  companyName?: string;
  inn?: string;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
      return data;
    },
    onSuccess: (data) => setSession(data.user, data.accessToken, data.refreshToken),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
      return data;
    },
    onSuccess: (data) => setSession(data.user, data.accessToken, data.refreshToken),
  });
}

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data;
    },
    enabled: !!accessToken,
    retry: false,
  });
}
