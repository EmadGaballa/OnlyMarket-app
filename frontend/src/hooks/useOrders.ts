import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ordersApi } from "../api/orders";
import { useToast } from "../context/ToastContext";
import { getApiErrorMessage } from "../utils/cartCache";

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: ordersApi.getOrders });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (orderId: number) => ordersApi.deleteOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      showToast({ type: "success", message: "Order canceled." });
    },
    onError: (error) => {
      showToast({
        type: "error",
        message: getApiErrorMessage(error, "Failed to cancel order."),
      });
    },
  });
}
