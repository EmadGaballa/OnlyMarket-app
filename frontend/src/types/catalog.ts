/**
 * Product lifecycle status
 */
export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

/**
 * Common catalog sorting parameters
 */
export type ProductSortOption =
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "newest"
  | "relevance"
  | (string & {});

/**
 * Brand details entity
 */
export interface Brand {
  id: number;
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  externalId?: number;
}

/**
 * Catalog category entity (supports tree hierarchies)
 */
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentCategoryId?: number;
  children?: Category[];
  displayOrder?: number;
}

/**
 * Individual product gallery image entry
 */
export interface ProductImage {
  id: number;
  url: string;
  displayOrder: number;
  altText?: string;
  isPrimary?: boolean;
}

/**
 * Key-value map of variant option dimensions (e.g. { Color: "Navy", Size: "L" })
 */
export type VariantAttributesMap = Record<string, string>;

/**
 * SKU-level product variant model
 */
export interface ProductVariant {
  id: number;
  sku: string;
  priceOverride?: number;
  effectivePrice: number;
  attributesJson: string; // Raw JSON payload from API
  attributes?: VariantAttributesMap; // Parsed utility object for UI consumption
  stockQuantity?: number;
  inStock?: boolean;
}

/**
 * Core product entity
 */
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  costPrice?: number;
  sku: string;
  status: ProductStatus;

  // Brand relations (flat + nested)
  brandId?: number;
  brandName?: string;
  brand?: Brand;

  // Category relations (flat + nested)
  categoryId?: number;
  categoryName?: string;
  category?: Category;

  sellerId?: number;
  averageRating: number;
  reviewCount: number;

  // Catalog highlights & badging flags
  isExpress?: boolean;
  isFeatured?: boolean;
  tags?: string[];

  images: ProductImage[];
  variants: ProductVariant[];

  createdAt: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  API Request & Query Payloads                                              */
/* -------------------------------------------------------------------------- */

/**
 * Filtering and pagination query params for listing products
 */
export interface ProductListParams {
  search?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  express?: boolean;
  featured?: boolean;
  status?: ProductStatus;
  sort?: ProductSortOption;
  page?: number;
  size?: number;
}

/* -------------------------------------------------------------------------- */
/*  Generic Pagination Structure                                              */
/* -------------------------------------------------------------------------- */

/**
 * Generic spring/REST backend paginated container
 */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}
