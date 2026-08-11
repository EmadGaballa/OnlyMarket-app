import { api } from "./client";
import type { CartItem } from "../types/cart";

/**
 * Safely extracts payload data whether the API client returns
 * an AxiosResponse object ({ data: T }) or unwraps it via interceptors.
 */
function extractData<T>(response: unknown): T {
  if (response && typeof response === "object" && "data" in response) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export const cartApi = {
  list: async (): Promise<CartItem[]> => {
    const res = await api.get<CartItem[]>("/cart");
    const data = extractData<CartItem[]>(res);
    return Array.isArray(data) ? data : [];
  },

  addItem: async (
    productVariantId: number,
    quantity: number,
  ): Promise<CartItem> => {
    const res = await api.post<CartItem>(
      `/cart/items?productVariantId=${productVariantId}&quantity=${quantity}`,
    );
    return extractData<CartItem>(res);
  },

  updateItem: async (
    cartItemId: number,
    quantity: number,
  ): Promise<CartItem> => {
    const res = await api.put<CartItem>(`/cart/items/${cartItemId}`, {
      quantity,
    });
    return extractData<CartItem>(res);
  },

  removeItem: async (cartItemId: number): Promise<void> => {
    const res = await api.delete<void>(`/cart/items/${cartItemId}`);
    return extractData<void>(res);
  },

  clear: async (): Promise<void> => {
    const res = await api.delete<void>("/cart");
    return extractData<void>(res);
  },
};
