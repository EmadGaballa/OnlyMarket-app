export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  costPrice?: number;
  sku: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  sellerId?: number;
  averageRating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
}

export interface ProductImage {
  id: number;
  url: string;
  displayOrder: number;
  altText?: string;
}

export interface ProductVariant {
  id: number;
  sku: string;
  priceOverride?: number;
  effectivePrice: number;
  attributesJson: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentCategoryId?: number;
}

export interface Brand {
  id: number;
  name: string;
  externalId?: number;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}