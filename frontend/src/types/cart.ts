/**
 * Minimal product image representation inside cart/wishlist contexts
 */
export interface CartProductImage {
  id?: number;
  url: string;
  altText?: string;
}

/**
 * Compact product summary embedded inside cart and wishlist items
 */
export interface CartProductSummary {
  id: number;
  name: string;
  slug: string;
  basePrice: number;
  images: CartProductImage[];
  brandName?: string;
  isExpress?: boolean;
}

/**
 * Key-value mapping of variant options (e.g., { Color: "Black", Size: "XL" })
 */
export type VariantAttributesMap = Record<string, string>;

/**
 * Flat, self-contained cart line item returned by the cart API
 * (mirrors backend {@code CartItemResponse}).
 */
export interface CartItem {
  id: number;
  productVariantId: number;
  productId: number;
  productName: string;
  productSlug: string;
  variantName: string | null;
  sku: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  inStock: boolean;
  maxAvailableQuantity: number;
}

/**
 * Cart aggregate returned by {@code GET /api/v1/cart} (mirrors backend
 * {@code CartResponse}). {@code subtotal} / {@code itemCount} are the
 * server-computed source of truth.
 */
export interface Cart {
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

/**
 * Wishlist item line entry
 */
export interface WishlistItem {
  id: number;
  wishlistId: number;
  productId: number;
  product: CartProductSummary;
  addedAt?: string;
}

/**
 * Complete user wishlist collection
 */
export interface Wishlist {
  id: number;
  userId: number;
  items: WishlistItem[];
  totalCount: number;
  updatedAt?: string;
}

/**
 * User favorite product relation
 */
export interface Favorite {
  id: number;
  userId: number;
  productId: number;
  product: CartProductSummary;
  createdAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  API Request Payloads / DTOs                                               */
/* -------------------------------------------------------------------------- */

export interface AddToCartInput {
  productVariantId: number;
  quantity: number;
}

export interface UpdateCartItemInput {
  cartItemId: number;
  quantity: number;
}

/** Request body for {@code POST /api/v1/cart/items}. */
export interface AddCartItemRequest {
  productVariantId: number;
  quantity: number;
}

/** Request body for {@code PUT /api/v1/cart/items/{cartItemId}}. */
export interface UpdateCartItemRequest {
  quantity: number;
}

export interface SyncCartItemInput {
  productVariantId: number;
  quantity: number;
}

export interface SyncCartPayload {
  guestToken?: string;
  items: SyncCartItemInput[];
}

export interface ToggleFavoriteInput {
  productId: number;
}
