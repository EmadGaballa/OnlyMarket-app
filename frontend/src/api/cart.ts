import { api } from './client';
import type { CartItem } from '../types/cart';

export const cartApi = {
  list: () =>
    api.get<CartItem[]>('/cart'),

  addItem: (productVariantId: number, quantity: number) =>
    api.post<CartItem>('/cart/items', { productVariantId, quantity }),

  updateItem: (cartItemId: number, quantity: number) =>
    api.put<CartItem>(`/cart/items/${cartItemId}`, { quantity }),

  removeItem: (cartItemId: number) =>
    api.delete<void>(`/cart/items/${cartItemId}`),

  clear: () =>
    api.delete<void>('/cart'),
};