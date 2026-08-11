import type { Cart, CartItem } from "../types/cart";

/** Product/variant snapshot used to build the optimistic placeholder item. */
export interface AddToCartOptimistic {
  productId?: number;
  productName: string;
  productSlug?: string;
  variantName?: string | null;
  sku?: string;
  imageUrl?: string | null;
  unitPrice: number;
  maxAvailableQuantity?: number;
}

export function emptyCart(): Cart {
  return { items: [], subtotal: 0, itemCount: 0 };
}

/** Recomputes lineTotal, subtotal and itemCount from a raw item list. */
function normalize(items: CartItem[]): Cart {
  const lines = items.map((item) => ({
    ...item,
    lineTotal: (item.unitPrice ?? 0) * (item.quantity ?? 1),
  }));
  return {
    items: lines,
    subtotal: lines.reduce((sum, item) => sum + item.lineTotal, 0),
    itemCount: lines.reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Optimistically applies an add-to-cart to the cached cart. If the variant is
 * already present the quantity is incremented; otherwise a placeholder item
 * is appended. The server response reconciles the placeholder afterwards.
 */
export function applyAddToCart(
  cart: Cart | undefined,
  productVariantId: number,
  quantity: number,
  optimistic: AddToCartOptimistic,
): Cart {
  const base = cart ?? emptyCart();
  const existing = base.items.find(
    (item) => item.productVariantId === productVariantId,
  );

  let items: CartItem[];
  if (existing) {
    items = base.items.map((item) =>
      item.productVariantId === productVariantId
        ? { ...item, quantity: item.quantity + quantity }
        : item,
    );
  } else {
    const item: CartItem = {
      // Negative id marks an in-flight/optimistic row; replaced after success.
      id: -Date.now(),
      productVariantId,
      productId: optimistic.productId ?? 0,
      productName: optimistic.productName,
      productSlug: optimistic.productSlug ?? "",
      variantName: optimistic.variantName ?? null,
      sku: optimistic.sku ?? "",
      imageUrl: optimistic.imageUrl ?? null,
      unitPrice: optimistic.unitPrice,
      quantity,
      lineTotal: optimistic.unitPrice * quantity,
      inStock: true,
      maxAvailableQuantity: optimistic.maxAvailableQuantity ?? Number.MAX_SAFE_INTEGER,
    };
    items = [...base.items, item];
  }

  return normalize(items);
}

/**
 * Replaces the optimistic/previous row for a variant with the authoritative
 * item returned by the server after a successful add.
 */
export function reconcileAddToCart(
  cart: Cart | undefined,
  serverItem: CartItem,
): Cart {
  const base = cart ?? emptyCart();
  const exists = base.items.some(
    (item) => item.productVariantId === serverItem.productVariantId,
  );
  const items = exists
    ? base.items.map((item) =>
        item.productVariantId === serverItem.productVariantId
          ? serverItem
          : item,
      )
    : [...base.items, serverItem];
  return normalize(items);
}

/** Optimistically applies a quantity change for a cart item. */
export function applyUpdateQuantity(
  cart: Cart | undefined,
  cartItemId: number,
  quantity: number,
): Cart {
  const base = cart ?? emptyCart();
  const items = base.items.map((item) =>
    item.id === cartItemId
      ? { ...item, quantity, lineTotal: (item.unitPrice ?? 0) * quantity }
      : item,
  );
  return normalize(items);
}

/** Replaces a single item with the authoritative server response. */
export function reconcileUpdate(
  cart: Cart | undefined,
  serverItem: CartItem,
): Cart {
  const base = cart ?? emptyCart();
  const items = base.items.map((item) =>
    item.id === serverItem.id ? serverItem : item,
  );
  return normalize(items);
}

/** Optimistically drops a line item from the cached cart. */
export function applyRemoveItem(
  cart: Cart | undefined,
  cartItemId: number,
): Cart {
  const base = cart ?? emptyCart();
  return normalize(base.items.filter((item) => item.id !== cartItemId));
}

/** Optimistically empties the cached cart. */
export function applyClearCart(): Cart {
  return emptyCart();
}

/**
 * Extracts a user-facing message from an API error. The backend returns an
 * {@code ApiErrorResponse} JSON body, which {@code client.ts} throws as the
 * raw text of the Error; this unwraps the {@code message} field when present.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as { message?: unknown };
      if (parsed && typeof parsed.message === "string" && parsed.message) {
        return parsed.message;
      }
    } catch {
      // Not JSON — fall through to the raw message.
    }
    return error.message || fallback;
  }
  return fallback;
}