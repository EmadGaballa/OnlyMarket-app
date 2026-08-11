import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wishlistApi } from "../api/wishlist";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import type { WishlistItem } from "../types/cart";

export function useWishlist() {
  const { isAuthenticated } = useAuth();

  return useQuery<WishlistItem[]>({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.list(),
    enabled: isAuthenticated,
  });
}

export function useAddToWishlist() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (productId: number) => wishlistApi.addItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      showToast({ type: "success", message: "Added to wishlist" });
    },
    onError: () => {
      showToast({ type: "error", message: "Couldn't add to wishlist" });
    },
  });
}

export function useRemoveFromWishlist() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (productId: number) => wishlistApi.removeItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      showToast({ type: "success", message: "Removed from wishlist" });
    },
    onError: () => {
      showToast({ type: "error", message: "Couldn't remove from wishlist" });
    },
  });
}
