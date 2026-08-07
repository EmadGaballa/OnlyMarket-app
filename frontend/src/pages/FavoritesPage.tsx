import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { favoritesApi } from '../api/favorites';
import styles from './FavoritesPage.module.css';

export default function FavoritesPage() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['favorites'],
    queryFn: favoritesApi.list,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => favoritesApi.remove(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  if (isLoading) return <div className={styles.page}><div className={styles.loading}>Loading favorites...</div></div>;
  if (error) return <div className={styles.page}><div className={styles.error}>Failed to load favorites.</div></div>;

  return (
    <div className={styles.page}>
      <h1>Your Favorites</h1>
      {items.length === 0 ? (
        <div className={styles.emptyState}>You have no favorites yet.</div>
      ) : (
        <div className={styles.productGrid}>
          {items.map((item) => (
            <div key={item.id} className={styles.productCard}>
              <Link to={`/products/${item.product.slug}`}>
                <div className={styles.productImage}>
                  {item.product.images[0] ? (
                    <img src={item.product.images[0].url} alt={item.product.name} />
                  ) : (
                    <div className={styles.placeholder}>No image</div>
                  )}
                </div>
                <div className={styles.productInfo}>
                  <h3>{item.product.name}</h3>
                  <p className={styles.price}>${item.product.basePrice.toFixed(2)}</p>
                </div>
              </Link>
              <button onClick={() => removeMutation.mutate(item.productId)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}