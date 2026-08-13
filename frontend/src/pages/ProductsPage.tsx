import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import { RatingStars } from "../components/RatingStars";
import AddToCartButton from "../components/AddToCartButton";
import {
  resolveDefaultVariantId,
  getProductPricing,
  formatVariantName,
} from "../utils/product";
import type { Product, Category, Brand } from "../types/catalog";
import {
  useWishlist,
  useAddToWishlist,
  useRemoveFromWishlist,
} from "../hooks/useWishlist";

import styles from "./ProductsPage.module.css";

/* -------------------------------------------------------------------------- */
/*  Helper functions to clean up and group category names                     */
/* -------------------------------------------------------------------------- */

// 1. Replaces dashes "-" with spaces and capitalizes every word
const formatCategoryName = (rawName: string): string => {
  if (!rawName) return "";
  return rawName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// 2. Map raw API slugs to broader, cleaner labels
const BROAD_CATEGORY_MAP: Record<string, string> = {
  fragrances: "Beauty & Fragrance",
  skincare: "Beauty & Fragrance",
  furniture: "Home & Furniture",
  "home-decoration": "Home & Furniture",
  "kitchen-accessories": "Home & Kitchen",
  laptops: "Electronics",
  smartphones: "Electronics",
  tablets: "Electronics",
  "mens-shirts": "Men's Fashion",
  "mens-shoes": "Men's Fashion",
  "mens-watches": "Men's Fashion",
  "womens-dresses": "Women's Fashion",
  "womens-shoes": "Women's Fashion",
  "womens-bags": "Women's Fashion",
  groceries: "Groceries",
};

// 3. Main function to convert raw category names to broad, readable names
const getBroadCategoryName = (rawName: string): string => {
  const normalizedKey = rawName.toLowerCase().trim();
  if (BROAD_CATEGORY_MAP[normalizedKey]) {
    return BROAD_CATEGORY_MAP[normalizedKey];
  }
  return formatCategoryName(rawName);
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State Extractor
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const brandId = searchParams.get("brandId") || "";
  const sort = searchParams.get("sort") || "";
  const page = Math.max(0, Number(searchParams.get("page") || "0"));
  const size = Number(searchParams.get("size") || "12");

  // React Query Hooks
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.listCategories,
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: productsApi.listBrands,
  });

  const {
    data: productsData,
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["products", search, categoryId, brandId, sort, page, size],
    queryFn: () =>
      productsApi.list({
        search: search || undefined,
        categoryId: categoryId ? Number(categoryId) : undefined,
        brandId: brandId ? Number(brandId) : undefined,
        sort: sort || undefined,
        page,
        size,
      }),
  });

  // URL Parameter Updater Helper
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);

    if (value !== null && value !== "") {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    // Reset page to 0 only when changing filters/sort, NOT when paginating
    if (key !== "page") {
      next.set("page", "0");
    }

    setSearchParams(next, { replace: true });
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const hasActiveFilters = Boolean(search || categoryId || brandId);

  const totalElements = productsData?.totalElements ?? 0;
  const startItem = totalElements === 0 ? 0 : page * size + 1;
  const endItem = Math.min((page + 1) * size, totalElements);

  return (
    <div className={styles.pageContainer}>
      {/* Search Header Banner / Title */}
      <header className={styles.headerBanner}>
        <h1 className={styles.pageTitle}>
          {search ? `Search Results for "${search}"` : "Explore All Products"}
        </h1>
        {productsData && totalElements > 0 && (
          <span className={styles.resultCount}>
            Showing {startItem}-{endItem} of <strong>{totalElements}</strong>{" "}
            items
          </span>
        )}
      </header>

      <div className={styles.catalogLayout}>
        {/* LEFT SIDEBAR: Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={clearAllFilters}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Categories Facet */}
          <div className={styles.filterGroup}>
            <h4>Category</h4>
            <ul className={styles.filterList}>
              <li>
                <button
                  type="button"
                  className={!categoryId ? styles.activeFilter : ""}
                  onClick={() => updateParam("categoryId", null)}
                >
                  All Categories
                </button>
              </li>
              {categories?.map((cat: Category) => (
                <li key={cat.id}>
                  <button
                    type="button"
                    className={
                      String(cat.id) === categoryId ? styles.activeFilter : ""
                    }
                    onClick={() => updateParam("categoryId", String(cat.id))}
                  >
                    {getBroadCategoryName(cat.name)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <hr className={styles.divider} />

          {/* Brands Facet */}
          <div className={styles.filterGroup}>
            <h4>Brand</h4>
            <ul className={styles.filterList}>
              <li>
                <button
                  type="button"
                  className={!brandId ? styles.activeFilter : ""}
                  onClick={() => updateParam("brandId", null)}
                >
                  All Brands
                </button>
              </li>
              {brands?.map((brand: Brand) => (
                <li key={brand.id}>
                  <button
                    type="button"
                    className={
                      String(brand.id) === brandId ? styles.activeFilter : ""
                    }
                    onClick={() => updateParam("brandId", String(brand.id))}
                  >
                    {brand.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className={styles.mainContent}>
          {/* Top Control Bar */}
          <div className={styles.controlBar}>
            <div className={styles.activeFiltersPills}>
              {search && (
                <span className={styles.pill}>
                  Query: {search}{" "}
                  <button
                    type="button"
                    onClick={() => updateParam("search", null)}
                    aria-label="Remove search filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>

            <div className={styles.sortWrapper}>
              <label htmlFor="sortSelect">Sort By:</label>
              <select
                id="sortSelect"
                value={sort}
                onChange={(e) => updateParam("sort", e.target.value)}
                className={styles.sortSelect}
              >
                <option value="">Relevance & Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="averageRating,desc">Highest Rated</option>
                <option value="newest">New Arrivals</option>
              </select>
            </div>
          </div>

          {/* Loading State Skeleton */}
          {productsLoading && (
            <div className={styles.productGrid}>
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className={styles.skeletonCard}>
                  <div className={styles.skeletonImage} />
                  <div className={styles.skeletonLine} />
                  <div className={styles.skeletonLineShort} />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {productsError && (
            <div className={styles.errorContainer}>
              <p>Unable to load products right now. Please try again.</p>
              <button type="button" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!productsLoading && productsData?.content.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🔍</div>
              <h3>No results found</h3>
              <p>Try adjusting your filters or search criteria.</p>
              <button
                type="button"
                onClick={clearAllFilters}
                className={styles.resetBtn}
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Product Grid */}
          {!productsLoading &&
            productsData &&
            productsData.content.length > 0 && (
              <div className={styles.productGrid}>
                {productsData.content.map((product: Product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

          {/* Pagination Controls */}
          {productsData && productsData.totalPages > 1 && (
            <div className={styles.paginationContainer}>
              <button
                type="button"
                disabled={page === 0}
                onClick={() => updateParam("page", String(page - 1))}
                className={styles.pageBtn}
              >
                ‹ Previous
              </button>

              <div className={styles.pageNumbers}>
                {Array.from({ length: productsData.totalPages }).map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${styles.pageNumber} ${
                      i === page ? styles.activePage : ""
                    }`}
                    onClick={() => updateParam("page", String(i))}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={page + 1 >= productsData.totalPages}
                onClick={() => updateParam("page", String(page + 1))}
                className={styles.pageBtn}
              >
                Next ›
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Dedicated Hybrid Product Card Component
function ProductCard({ product }: { product: Product }) {
  const mainImage = product.images?.[0]?.url || "/placeholder-product.png";

  const defaultVariant = product.variants?.[0];
  const defaultVariantId = resolveDefaultVariantId(product);
  const unitPrice = defaultVariant?.effectivePrice ?? product.basePrice;
  const variantName = defaultVariant
    ? formatVariantName(defaultVariant.attributesJson)
    : null;
  const maxAvailableQuantity = defaultVariant?.stockQuantity;

  const { currentPrice, originalPrice, discountPercent, hasDiscount } =
    getProductPricing(product.id, product.basePrice);

  const { data: wishlist } = useWishlist();
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const isWishlisted = wishlist?.some((item) => item.productId === product.id);

  const handleWishlistClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist.mutate(product.id);
    } else {
      addToWishlist.mutate(product.id);
    }
  };

  return (
    <div className={styles.card}>
      <Link to={`/products/${product.slug}`} className={styles.cardLink}>
        {/* Badge Section */}
        <div className={styles.badgeContainer}>
          {hasDiscount && (
            <span className={styles.discountBadge}>{discountPercent}% OFF</span>
          )}
          <button
            type="button"
            className={styles.wishlistBtn}
            onClick={handleWishlistClick}
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        </div>

        {/* Product Image */}
        <div className={styles.imageWrapper}>
          <img
            src={mainImage}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* Info Section */}
        <div className={styles.cardBody}>
          <div className={styles.brandName}>
            {product.brand?.name || "OnlyMarket"}
          </div>
          <h3 className={styles.productTitle} title={product.name}>
            {product.name}
          </h3>

          {/* Ratings Snippet */}
          <div className={styles.ratingRow}>
            <RatingStars
              rating={product.averageRating ?? 0}
              reviewCount={product.reviewCount ?? 0}
              size={14}
            />
          </div>

          {/* Pricing Row */}
          <div className={styles.priceRow}>
            <span className={styles.currency}>$</span>
            <span className={styles.currentPrice}>
              {currentPrice.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            {hasDiscount && (
              <span className={styles.oldPrice}>
                $
                {originalPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Quick Add Button */}
      <div className={styles.cardFooter}>
        <AddToCartButton
          size="compact"
          productVariantId={defaultVariantId}
          quantity={1}
          productId={product.id}
          productName={product.name}
          productSlug={product.slug}
          imageUrl={mainImage}
          sku={defaultVariant?.sku}
          variantName={variantName}
          unitPrice={unitPrice}
          maxAvailableQuantity={maxAvailableQuantity}
          showStockHint
        />
      </div>
    </div>
  );
}
