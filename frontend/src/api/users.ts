import { api } from './client';
import type {
  User,
  Address,
  AddressRequest,
  ChangePasswordRequest,
} from '../types/auth';

export const usersApi = {
  me: () =>
    api.get<User>('/users/me'),

  updateProfile: (data: Partial<User>) =>
    api.put<User>('/users/me', data),

  changePassword: (data: ChangePasswordRequest) =>
    api.patch<User>('/users/me/password', data),

  changeName: (fullName: string) =>
    api.patch<User>('/users/me/name', { fullName }),

  changeEmail: (data: { newEmail: string; currentPassword: string }) =>
    api.patch<User>('/users/me/email', data),

  deleteAccount: (currentPassword: string) =>
    api.delete<void>('/users/me', { currentPassword }),

  listAddresses: () =>
    api.get<Address[]>('/users/me/addresses'),

  addAddress: (data: AddressRequest) =>
    api.post<Address>('/users/me/addresses', data),

  updateAddress: (addressId: number, data: AddressRequest) =>
    api.put<Address>(`/users/me/addresses/${addressId}`, data),

  deleteAddress: (addressId: number) =>
    api.delete<void>(`/users/me/addresses/${addressId}`),
};