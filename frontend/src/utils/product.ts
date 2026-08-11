import type { Product, ProductVariant } from "../types/catalog";

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
  if (legacyVariants && legacyVariants.length > 0 && legacyVariants[0].id != null) {
    return Number(legacyVariants[0].id);
  }

  const defaultVariantId = (product as ProductWithVariants).defaultVariantId;
  if (defaultVariantId != null) {
    return Number(defaultVariantId);
  }

  return product.id;
}