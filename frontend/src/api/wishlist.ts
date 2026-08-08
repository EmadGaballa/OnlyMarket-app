import { api } from "./client";
import type { WishlistItem } from "../types/cart";

export const wishlistApi = {
  list: async (): Promise<WishlistItem[]> => {
    const response = await api.get<WishlistItem[]>("/wishlist");

    // Handle both direct arrays and wrapped responses safely
    if (Array.isArray(response)) {
      return response;
    }
    if (
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray((response as any).data)
    ) {
      return (response as any).data;
    }

    return [];
  },

  addItem: (productId: number) =>
    api.post<WishlistItem>("/wishlist/items", { productId }),

  removeItem: (productId: number) =>
    api.delete<void>(`/wishlist/items/${productId}`),
};
