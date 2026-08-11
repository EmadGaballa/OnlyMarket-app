import { api } from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  refresh: () =>
    api.post<{ accessToken: string }>('/auth/refresh'),

  logout: () =>
    api.post<void>('/auth/logout'),

  me: () =>
    api.get<User>('/users/me'),
};