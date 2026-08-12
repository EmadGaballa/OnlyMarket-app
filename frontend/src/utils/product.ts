import type { Product, ProductVariant, ProductPricing } from "../types/catalog";

/**
 * Parses a variant's {@code attributesJson} (raw JSON string) into a key/value
 * map. Returns undefined when the payload is missing or malformed.
 */
export function parseVariantAttributes(
  attributesJson?: string,
): Record<string, string> | undefined {
  if (!attributesJson) return undefined;
  try {
    return JSON.parse(attributesJson) as Record<string, string>;
  } catch {
    return undefined;
  }
}

/**
 * Renders a variant's attributes into a single human label, e.g.
 * {@code {"Color":"Blue","Size":"Large"}} → {@code "Blue / Large"}.
 * Returns null when there is nothing to render.
 */
export function formatVariantName(attributesJson?: string): string | null {
  const attributes = parseVariantAttributes(attributesJson);
  if (!attributes) return null;
  const values = Object.values(attributes)
    .map(String)
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values.join(" / ") : null;
}

export interface ProductWithVariants extends Product {
  productVariants?: ProductVariant[];
  defaultVariantId?: number;
}

/**
 * Resolves the default purchasable variant id for a product. Mirrors the
 * fallback chain previously inlined in ProductDetailPage: prefer
 * {@code product.variants[0].id}, then legacy {@code productVariants[0].id},
 * then {@code defaultVariantId}, and finally the product id itself for
 * products without an explicit variant concept.
 */
export function resolveDefaultVariantId(
  product?: Product | ProductWithVariants,
): number | undefined {
  if (!product) return undefined;

  const variants = product.variants ?? [];
  if (variants.length > 0 && variants[0].id != null) {
    return Number(variants[0].id);
  }

  const legacyVariants = (product as ProductWithVariants).productVariants;
  if (
    legacyVariants &&
    legacyVariants.length > 0 &&
    legacyVariants[0].id != null
  ) {
    return Number(legacyVariants[0].id);
  }

  const defaultVariantId = (product as ProductWithVariants).defaultVariantId;
  if (defaultVariantId != null) {
    return Number(defaultVariantId);
  }

  return product.id;
}

/* -------------------------------------------------------------------------- */
/*  Dynamic Deterministic Discount Logic                                      */
/* -------------------------------------------------------------------------- */

/**
 * Computes a deterministic normalized float [0, 1) based on a product ID/slug string.
 */
function getProductSeed(id: number | string): number {
  const str = String(id);
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33 + str.charCodeAt(i)) | 0;
  }
  // Final avalanche mix so even short/small ids (e.g. "1", "12") spread
  // evenly across [0, 1) instead of clustering near 0.
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 4294967295;
}

/**
 * Calculates a deterministic discount percentage based on product ID:
 * - 60% chance: 0% discount
 * - 40% chance: 5% to 40% discount (tiered distribution)
 */
export function getProductDiscount(productId: number | string): number {
  const seed = getProductSeed(productId);

  // 60% of products get 0% discount
  if (seed < 0.6) {
    return 0;
  }

  // Normalized roll [0, 1) for the remaining 40%
  const roll = (seed - 0.6) / 0.4;

  if (roll < 0.5) {
    // 50% of discounted items (20% total) -> 5% - 15% OFF
    return Math.floor(5 + (roll / 0.5) * 11);
  } else if (roll < 0.8) {
    // 30% of discounted items (12% total) -> 16% - 25% OFF
    const tierRoll = (roll - 0.5) / 0.3;
    return Math.floor(16 + tierRoll * 10);
  } else if (roll < 0.95) {
    // 15% of discounted items (6% total) -> 26% - 35% OFF
    const tierRoll = (roll - 0.8) / 0.15;
    return Math.floor(26 + tierRoll * 10);
  } else {
    // 5% of discounted items (2% total) -> 36% - 40% OFF
    const tierRoll = (roll - 0.95) / 0.05;
    return Math.floor(36 + tierRoll * 5);
  }
}

/**
 * Computes full pricing metrics for a product or active base price.
 */
export function getProductPricing(
  productId: number | string,
  basePrice: number,
): ProductPricing {
  const discountPercent = getProductDiscount(productId);
  const hasDiscount = discountPercent > 0;

  const originalPrice = hasDiscount
    ? basePrice / (1 - discountPercent / 100)
    : basePrice;

  return {
    currentPrice: basePrice,
    originalPrice,
    discountPercent,
    hasDiscount,
  };
}
