export interface CartItem {
  id: number;
  cartId: number;
  productVariantId: number;
  quantity: number;
  productVariant: {
    id: number;
    sku: string;
    priceOverride?: number;
    effectivePrice: number;
    attributesJson: string;
    product: {
      id: number;
      name: string;
      slug: string;
      basePrice: number;
      images: { url: string }[];
    };
  };
}

export interface WishlistItem {
  id: number;
  wishlistId: number;
  productId: number;
  product: {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
    images: { url: string }[];
  };
}

export interface Favorite {
  id: number;
  userId: number;
  productId: number;
  product: {
    id: number;
    name: string;
    slug: string;
    basePrice: number;
    images: { url: string }[];
  };
}