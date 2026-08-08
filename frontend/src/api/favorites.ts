import { api } from "./client";
import type { Favorite } from "../types/cart";

export const favoritesApi = {
  list: async (): Promise<Favorite[]> => {
    const res = await api.get<any>("/favorites");
    // Handles direct arrays, Axios responses, or wrapped objects ({ data: [...] })
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.favorites)) return res.favorites;
    return [];
  },

  add: (productId: number) => api.post<Favorite>(`/favorites/${productId}`),

  remove: (productId: number) => api.delete<void>(`/favorites/${productId}`),
};
