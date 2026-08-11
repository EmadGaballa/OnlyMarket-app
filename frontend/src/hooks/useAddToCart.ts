import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cartApi } from "../api/cart";
import { useToast } from "../context/ToastContext";
import type { Cart } from "../types/cart";
import {
  type AddToCartOptimistic,
  applyAddToCart,
  getApiErrorMessage,
  reconcileAddToCart,
} from "../utils/cartCache";

export interface AddToCartArgs {
  productVariantId: number;
  quantity?: number;
  /** Snapshot used for the optimistic cache row and the success toast. */
  optimistic: AddToCartOptimistic;
}

const JUST_ADDED_MS = 2000;

/**
 * Add-to-cart mutation with:
 *  - optimistic UI: the new line immediately appears in the {@code ["cart"]}
 *    cache (incremented if the variant is already present) so the header badge
 *    updates instantly;
 *  - reconciliation with the authoritative server item on success;
 *  - rollback + error toast on failure (e.g. stock exceeded);
 *  - a success toast ("{name} added to cart") with a View Cart action;
 *  - a per-variant "just added" flag callers use for button state.
 */
export function useAddToCart() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [justAddedIds, setJustAddedIds] = useState<Record<number, boolean>>({});

  const mutation = useMutation({
    mutationFn: ({ productVariantId, quantity }: AddToCartArgs) =>
      cartApi.addItem({ productVariantId, quantity: quantity ?? 1 }),

    async onMutate(variables) {
      await queryClient.cancelQueries({ queryKey: ["cart"] });
      const previous = queryClient.getQueryData<Cart>(["cart"]);
      queryClient.setQueryData<Cart>(["cart"], (old) =>
        applyAddToCart(
          old,
          variables.productVariantId,
          variables.quantity ?? 1,
          variables.optimistic,
        ),
      );
      return { previous };
    },

    onSuccess(serverItem, variables) {
      queryClient.setQueryData<Cart>(["cart"], (old) =>
        reconcileAddToCart(old, serverItem),
      );

      const name = variables.optimistic.productName;
      showToast({
        type: "success",
        message: name ? `${name} added to cart` : "Item added to cart",
        imageUrl: variables.optimistic.imageUrl,
        action: { label: "View Cart", to: "/cart" },
      });

      const variantId = variables.productVariantId;
      setJustAddedIds((prev) => ({ ...prev, [variantId]: true }));
      window.setTimeout(() => {
        setJustAddedIds((prev) => {
          if (!prev[variantId]) return prev;
          const next = { ...prev };
          delete next[variantId];
          return next;
        });
      }, JUST_ADDED_MS);
    },

    onError(error, _variables, context) {
      if (context?.previous) {
        queryClient.setQueryData<Cart>(["cart"], context.previous);
      } else {
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      }
      showToast({ type: "error", message: getApiErrorMessage(error) });
    },
  });

  const isJustAdded = useCallback(
    (variantId: number) => Boolean(justAddedIds[variantId]),
    [justAddedIds],
  );

  return {
    addToCart: mutation.mutate,
    isPending: mutation.isPending,
    isJustAdded,
    error: mutation.error,
  };
}