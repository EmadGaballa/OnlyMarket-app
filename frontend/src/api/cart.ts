import { api } from "./client";

import type {
  AddCartItemRequest,
  Cart,
  CartItem,
  UpdateCartItemRequest,
} from "../types/cart";

function extractData<T>(response: unknown): T {
  if (
    response &&
    typeof response === "object" &&
    "data" in response
  ) {
    return (response as { data: T }).data;
  }

  return response as T;
}

export const cartApi = {
  list: async (): Promise<Cart> => {
    const response = await api.get<Cart>("/cart");
    const data = extractData<Cart>(response);

    if (data && Array.isArray(data.items)) {
      return data;
    }

    return {
      items: [],
      subtotal: 0,
      itemCount: 0,
    };
  },

  addItem: async (
    payload: AddCartItemRequest,
  ): Promise<CartItem> => {
    const response = await api.post<CartItem>(
      "/cart/items",
      payload,
    );

    return extractData<CartItem>(response);
  },

  updateItem: async (
    cartItemId: number,
    quantity: number,
  ): Promise<CartItem> => {
    const body: UpdateCartItemRequest = {
      quantity,
    };

    const response = await api.put<CartItem>(
      `/cart/items/${cartItemId}`,
      body,
    );

    return extractData<CartItem>(response);
  },

  removeItem: async (
    cartItemId: number,
  ): Promise<void> => {
    const response = await api.delete<void>(
      `/cart/items/${cartItemId}`,
    );

    return extractData<void>(response);
  },

  clear: async (): Promise<void> => {
    const response = await api.delete<void>("/cart");

    return extractData<void>(response);
  },
};