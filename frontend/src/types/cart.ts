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
 * Product variant details attached to a cart line item
 */
export interface CartProductVariant {
  id: number;
  sku: string;
  priceOverride?: number;
  effectivePrice: number;
  attributesJson: string; // Raw JSON string from server
  attributes?: VariantAttributesMap; // Parsed utility object for UI rendering
  stockQuantity?: number;
  product: CartProductSummary;
}

/**
 * Individual line item in the shopping cart
 */
export interface CartItem {
  id: number;
  cartId: number;
  productVariantId: number;
  quantity: number;
  productVariant: CartProductVariant;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Complete shopping cart aggregate entity
 */
export interface Cart {
  id: number;
  userId?: number | null;
  guestToken?: string | null;
  items: CartItem[];
  totalItems: number; // Distinct line items
  itemCount: number; // Sum of all quantities
  subtotal: number;
  shippingTotal?: number;
  discountTotal?: number;
  grandTotal: number;
  updatedAt?: string;
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
