import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders";
import { useToast } from "../context/ToastContext";
import { getApiErrorMessage } from "../utils/cartCache";
import type { Order, PlaceOrderRequest } from "../types/order";

/**
 * Places an order from the current cart. On success the cart and orders query
 * caches are invalidated so the UI reflects the cleared cart and the new order.
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation<Order, Error, PlaceOrderRequest>({
    mutationFn: (data) => ordersApi.placeOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      showToast({ type: "error", message: getApiErrorMessage(error) });
    },
  });
}