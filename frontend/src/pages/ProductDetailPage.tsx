import { useState, useEffect, SyntheticEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { RatingStars } from "../components/RatingStars";
import { ProductReviews } from "../components/ProductReviews";
import AddToCartButton from "../components/AddToCartButton";
import { useCart } from "../hooks/useCart";
import { formatVariantName, resolveDefaultVariantId } from "../utils/product";
import styles from "./ProductDetailPage.module.css";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null,
  );

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => productsApi.getBySlug(slug!),
    enabled: !!slug,
  });

  // Resolve the target variant id (selected variant, else default/first)
  const targetVariantId = selectedVariantId ?? resolveDefaultVariantId(product);

  // Effective price / stock for the currently targeted variant
  const selectedVariant =
    product?.variants?.find((v) => v.id === targetVariantId) ??
    product?.variants?.[0];
  const unitPrice = selectedVariant?.effectivePrice ?? product?.basePrice ?? 0;
  const stockQuantity = selectedVariant?.stockQuantity;
  const variantAttributesJson = selectedVariant?.attributesJson;

  const { data: cart } = useCart();
  const cartItem = cart?.items?.find(
    (item) => item.productVariantId === targetVariantId,
  );

  // Reset states and update variant ID whenever the product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);

    if (product) {
      const vId = resolveDefaultVariantId(product);

      if (vId != null) {
        setSelectedVariantId(Number(vId));
      }
    }
  }, [slug, product]);

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
          <p>
            The product you are looking for does not exist or has been removed.
          </p>
          <Link to="/" className={styles.backButton}>
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex] || images[0];

  const handleImageError = (e: SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src =
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 24 24" fill="none" stroke="%23ccc" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>';
  };

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link to="/" className={styles.backLink}>
          ← Back to products
        </Link>
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
                  className={`${styles.thumbnailButton} ${
                    selectedImageIndex === idx ? styles.activeThumbnail : ""
                  }`}
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
            {product.brandName && (
              <span className={styles.brandBadge}>{product.brandName}</span>
            )}
            {product.categoryName && (
              <span className={styles.categoryBadge}>
                {product.categoryName}
              </span>
            )}
          </div>

          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.ratingRow}>
            <RatingStars
              rating={product.averageRating ?? 0}
              showCount={false}
              size={16}
            />
            <span className={styles.ratingText}>
              ({product.reviewCount ?? 0} reviews)
            </span>
          </div>

          <div className={styles.priceContainer}>
            <span className={styles.price}>${(unitPrice ?? 0).toFixed(2)}</span>
            {stockQuantity != null && stockQuantity <= 5 && (
              <span className={styles.stockNotice}>
                {stockQuantity > 0
                  ? `Only ${stockQuantity} left in stock`
                  : "Out of stock"}
              </span>
            )}
          </div>

          <p className={styles.description}>{product.description}</p>

          <hr className={styles.divider} />

          {/* Add to Cart Controls */}
          <div className={styles.actions}>
            {!cartItem && (
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
                  onClick={() =>
                    setQuantity((q) =>
                      stockQuantity != null
                        ? Math.min(q + 1, stockQuantity)
                        : q + 1,
                    )
                  }
                  disabled={stockQuantity != null && quantity >= stockQuantity}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}

            <AddToCartButton
              productVariantId={
                targetVariantId != null ? Number(targetVariantId) : undefined
              }
              quantity={quantity}
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              imageUrl={currentImage?.url}
              sku={selectedVariant?.sku}
              variantName={formatVariantName(variantAttributesJson)}
              unitPrice={unitPrice}
              maxAvailableQuantity={stockQuantity}
              showStockHint
            />
          </div>
        </div>
      </div>

      {/* Product Reviews Section */}
      <ProductReviews
        productId={product.id}
        averageRating={product.averageRating ?? 0}
        reviewCount={product.reviewCount ?? 0}
        onReviewSubmitted={refetch}
      />
    </div>
  );
}
