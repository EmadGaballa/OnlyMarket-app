import { api } from './client';
import type { WishlistItem } from '../types/cart';

export const wishlistApi = {
  list: () =>
    api.get<WishlistItem[]>('/wishlist'),

  addItem: (productId: number) =>
    api.post<WishlistItem>('/wishlist/items', { productId }),

  removeItem: (productId: number) =>
    api.delete<void>(`/wishlist/items/${productId}`),
};