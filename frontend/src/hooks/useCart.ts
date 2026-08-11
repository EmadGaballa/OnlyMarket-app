import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { Cart } from "../types/cart";
import {
  applyClearCart,
  applyRemoveItem,
  applyUpdateQuantity,
  getApiErrorMessage,
} from "../utils/cartCache";

/**
 * Reads the shared {@code ["cart"]} query cache. Auto-disabled while the user
 * is unauthenticated so anonymous visitors never fire a doomed request.
 */
export function useCart() {
  const { isAuthenticated } = useAuth();
  return useQuery<Cart>({
    queryKey: ["cart"],
    queryFn: () => cartApi.list(),
    enabled: isAuthenticated,
  });
}

/** Update quantity with an optimistic cache write and rollback + toast on error. */
export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      cartApi.updateItem(cartItemId, quantity),

    async onMutate({ cartItemId, quantity }) {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      queryClient.setQueryData<Cart>(["cart"], (old) =>
        applyUpdateQuantity(old, cartItemId, quantity),
      );
      return { previous };
    },

    onError(error, _variables, context) {
      if (context?.previous) {
        queryClient.setQueryData<Cart>(["cart"], context.previous);
      }
      showToast({ type: "error", message: getApiErrorMessage(error) });
    },
  });
}

/** Remove a line item with an optimistic cache write and rollback + toast on error. */
export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (cartItemId: number) => cartApi.removeItem(cartItemId),

    async onMutate(cartItemId) {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      queryClient.setQueryData<Cart>(["cart"], (old) =>
        applyRemoveItem(old, cartItemId),
      );
      return { previous };
    },

    onError(error, _cartItemId, context) {
      if (context?.previous) {
        queryClient.setQueryData<Cart>(["cart"], context.previous);
      }
      showToast({ type: "error", message: getApiErrorMessage(error) });
    },
  });
}

/** Clear the cart with an optimistic cache write and rollback + toast on error. */
export function useClearCart() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: () => cartApi.clear(),

    async onMutate() {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      queryClient.setQueryData<Cart>(["cart"], applyClearCart());
      return { previous };
    },

    onError(error, _variables, context) {
      if (context?.previous) {
        queryClient.setQueryData<Cart>(["cart"], context.previous);
      }
      showToast({ type: "error", message: getApiErrorMessage(error) });
    },
  });
}