import { api } from './client';
import type { User, Address, AddressRequest } from '../types/auth';

export const usersApi = {
  me: () =>
    api.get<User>('/users/me'),

  updateProfile: (data: Partial<User>) =>
    api.put<User>('/users/me', data),

  listAddresses: () =>
    api.get<Address[]>('/users/me/addresses'),

  addAddress: (data: AddressRequest) =>
    api.post<Address>('/users/me/addresses', data),

  updateAddress: (addressId: number, data: AddressRequest) =>
    api.put<Address>(`/users/me/addresses/${addressId}`, data),

  deleteAddress: (addressId: number) =>
    api.delete<void>(`/users/me/addresses/${addressId}`),
};