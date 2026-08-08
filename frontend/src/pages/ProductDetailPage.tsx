import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi } from '../api/products';
import { useQuery } from '@tanstack/react-query';
import styles from './ProductDetailPage.module.css';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <h2>Product Not Found</h2>
          <p>The product you are looking for does not exist or has been removed.</p>
          <Link to="/" className={styles.backButton}>Back to Shop</Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex] || images[0];

  // Helper for rendering star rating
  const renderStars = (rating: number = 0) => {
    const rounded = Math.round(rating);
    return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  };

  // Safe fallback handler when an image fails to load
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  };

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link to="/" className={styles.backLink}>← Back to products</Link>
      </nav>

      <div className={styles.productDetail}>
        {/* Gallery Section */}
        <div className={styles.gallerySection}>
          <div className={styles.mainImageContainer}>
            {currentImage?.url ? (
              <img
                src={currentImage.url}
                alt={product.name}
                className={styles.mainImage}
                onError={handleImageError}
              />
            ) : (
              <div className={styles.placeholder}>No image available</div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className={styles.thumbnailGrid}>
              {images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  type="button"
                  className={`${styles.thumbnailButton} ${selectedImageIndex === idx ? styles.activeThumbnail : ''}`}
                  onClick={() => setSelectedImageIndex(idx)}
                  aria-label={`View image ${idx + 1}`}
                >
                  <img
                    src={img.url}
                    alt={`${product.name} thumbnail ${idx + 1}`}
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Purchase Section */}
        <div className={styles.productDetailInfo}>
          <div className={styles.badges}>
            {product.brandName && <span className={styles.brandBadge}>{product.brandName}</span>}
            {product.categoryName && <span className={styles.categoryBadge}>{product.categoryName}</span>}
          </div>

          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.ratingRow}>
            <span className={styles.stars}>{renderStars(product.averageRating)}</span>
            <span className={styles.ratingText}>
              {product.averageRating ? product.averageRating.toFixed(1) : '0.0'} ({product.reviewCount ?? 0} reviews)
            </span>
          </div>

          <div className={styles.priceContainer}>
            <span className={styles.price}>${product.basePrice.toFixed(2)}</span>
          </div>

          <p className={styles.description}>{product.description}</p>

          <hr className={styles.divider} />

          {/* Add to Cart Controls */}
          <div className={styles.actions}>
            <div className={styles.quantitySelector}>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className={styles.addToCartButton}
              onClick={() => {
                // Implement cart integration
                alert(`Added ${quantity} x ${product.name} to cart!`);
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}