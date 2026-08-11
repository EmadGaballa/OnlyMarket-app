import { api } from "./client";
import type {
  AddCartItemRequest,
  Cart,
  CartItem,
  UpdateCartItemRequest,
} from "../types/cart";

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
  list: async (): Promise<Cart> => {
    const res = await api.get<Cart>("/cart");
    const data = extractData<Cart>(res);
    return data && Array.isArray(data.items)
      ? data
      : { items: [], subtotal: 0, itemCount: 0 };
  },

  addItem: async (payload: AddCartItemRequest): Promise<CartItem> => {
    const res = await api.post<CartItem>("/cart/items", payload);
    return extractData<CartItem>(res);
  },

  updateItem: async (
    cartItemId: number,
    quantity: number,
  ): Promise<CartItem> => {
    const body: UpdateCartItemRequest = { quantity };
    const res = await api.put<CartItem>(`/cart/items/${cartItemId}`, body);
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
