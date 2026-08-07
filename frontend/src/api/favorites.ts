import { api } from './client';
import type { Favorite } from '../types/cart';

export const favoritesApi = {
  list: () =>
    api.get<Favorite[]>('/favorites'),

  add: (productId: number) =>
    api.post<Favorite>(`/favorites/${productId}`),

  remove: (productId: number) =>
    api.delete<void>(`/favorites/${productId}`),
};