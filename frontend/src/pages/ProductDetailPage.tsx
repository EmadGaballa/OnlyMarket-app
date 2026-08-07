import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useQuery } from '@tanstack/react-query';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <div className={styles.page}><div className={styles.loading}>Loading product...</div></div>;
  if (error || !product) return <div className={styles.page}><div className={styles.error}>Product not found.</div></div>;

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.backLink}>← Back to products</Link>
      <div className={styles.productDetail}>
        <div className={styles.productDetailImage}>
          {product.images[0] ? (
            <img src={product.images[0].url} alt={product.name} />
          ) : (
            <div className={styles.placeholder}>No image</div>
          )}
        </div>
        <div className={styles.productDetailInfo}>
          <h1>{product.name}</h1>
          <p className={styles.price}>${product.basePrice.toFixed(2)}</p>
          <p className={styles.description}>{product.description}</p>
          <div className={styles.meta}>
            {product.brandName && <span>Brand: {product.brandName}</span>}
            {product.categoryName && <span>Category: {product.categoryName}</span>}
            <span>Rating: {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)</span>
          </div>
        </div>
      </div>
    </div>
  );
}