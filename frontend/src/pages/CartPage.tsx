import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../api/cart';
import styles from './CartPage.module.css';

export default function CartPage() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ cartItemId, quantity }: { cartItemId: number; quantity: number }) =>
      cartApi.updateItem(cartItemId, quantity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (cartItemId: number) => cartApi.removeItem(cartItemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (isLoading) return <div className={styles.page}><div className={styles.loading}>Loading cart...</div></div>;
  if (error) return <div className={styles.page}><div className={styles.error}>Failed to load cart.</div></div>;

  const total = items.reduce((sum, item) => sum + item.productVariant.effectivePrice * item.quantity, 0);

  return (
    <div className={styles.page}>
      <h1>Your Cart</h1>
      {items.length === 0 ? (
        <div className={styles.emptyState}>Your cart is empty.</div>
      ) : (
        <>
          <div className={styles.cartItems}>
            {items.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.cartItemInfo}>
                  <h3>{item.productVariant.product.name}</h3>
                  <p>${item.productVariant.effectivePrice.toFixed(2)}</p>
                </div>
                <div className={styles.cartItemActions}>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value));
                      updateMutation.mutate({ cartItemId: item.id, quantity: qty });
                    }}
                  />
                  <button onClick={() => removeMutation.mutate(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.cartSummary}>
            <p>Total: ${total.toFixed(2)}</p>
            <button onClick={() => clearMutation.mutate()}>Clear Cart</button>
          </div>
        </>
      )}
    </div>
  );
}