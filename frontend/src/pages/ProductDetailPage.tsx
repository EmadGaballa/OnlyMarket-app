import { useState, useEffect, SyntheticEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { RatingStars } from "../components/RatingStars";

import {
  resolveDefaultVariantId,
  getProductPricing,
  formatVariantName,
} from "../utils/product";
import { ProductReviews } from "../components/ProductReviews";
import AddToCartButton from "../components/AddToCartButton";
import { useCart, useRemoveCartItem } from "../hooks/useCart";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "../hooks/useWishlist";
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

  // Resolve target variant ID
  const targetVariantId = selectedVariantId ?? resolveDefaultVariantId(product);

  const selectedVariant =
    product?.variants?.find((v) => v.id === targetVariantId) ??
    product?.variants?.[0];
  const unitPrice = selectedVariant?.effectivePrice ?? product?.basePrice ?? 0;

  const { originalPrice, discountPercent, hasDiscount } = product
    ? getProductPricing(product.id, unitPrice)
    : { originalPrice: 0, discountPercent: 0, hasDiscount: false };
  const stockQuantity = selectedVariant?.stockQuantity;
  const variantAttributesJson = selectedVariant?.attributesJson;

  // Cart Hooks
  const { data: cart } = useCart();
  const removeCartItem = useRemoveCartItem();
  const cartItem = cart?.items?.find(
    (item) => item.productVariantId === targetVariantId,
  );

  // Wishlist Hooks
  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const isWishlisted = wishlist?.some((item) => item.productId === product?.id);

  const handleWishlistClick = () => {
    if (!product) return;
    if (isWishlisted) {
      removeFromWishlist.mutate(product.id);
    } else {
      addToWishlist.mutate(product.id);
    }
  };

  const handleRemoveFromCart = () => {
    if (cartItem) {
      removeCartItem.mutate(cartItem.id);
    }
  };

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

        {/* Info & Purchase Section */}
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <h1 className={styles.title}>{product.name}</h1>
            <button
              type="button"
              onClick={handleWishlistClick}
              title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              aria-label={
                isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"
              }
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "28px",
                lineHeight: 1,
                color: isWishlisted ? "#e11d48" : "#999",
                flexShrink: 0,
              }}
            >
              {isWishlisted ? "♥" : "♡"}
            </button>
          </div>

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
            <div className={styles.priceRow}>
              <span className={styles.price}>${unitPrice.toFixed(2)}</span>
              {hasDiscount && originalPrice > unitPrice && (
                <>
                  <span className={styles.oldPrice}>
                    ${originalPrice.toFixed(2)}
                  </span>
                  <span className={styles.discountBadge}>
                    {Math.round(discountPercent)}% OFF
                  </span>
                </>
              )}
            </div>
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

          {/* Cart Controls */}
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

            {/* Quick Remove Button when Item is in Cart */}
            {cartItem && (
              <button
                type="button"
                onClick={handleRemoveFromCart}
                title="Remove product from cart"
                aria-label="Remove product from cart"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  padding: "0 14px",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid #fecdd3",
                  backgroundColor: "#fff1f2",
                  color: "#e11d48",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                <span>Remove</span>
              </button>
            )}
          </div>

          <hr className={styles.divider} />

          {/* Shipping & Delivery Information Block */}
          <div className={styles.shippingInfo}>
            <div className={styles.shippingHeader}>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.shippingIcon}
              >
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
              Shipping & Delivery Information
            </div>

            <div className={styles.shippingList}>
              <div className={styles.shippingItem}>
                <span className={styles.shippingEmoji}>🚚</span>
                <span>
                  <strong>Local Shipping:</strong> Estimated delivery times and
                  fulfillment options are dynamically calculated at checkout
                  based on your destination.
                </span>
              </div>

              <div className={styles.shippingItem}>
                <span className={styles.shippingEmoji}>✈️</span>
                <span>
                  <strong>International Express:</strong> Standard international
                  delivery typically arrives within 5 to 7 business days. Fully
                  tracked door-to-door.
                </span>
              </div>
            </div>
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
