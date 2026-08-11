import { useCallback } from "react";
import type { MouseEvent } from "react";
import { useAddToCart } from "../hooks/useAddToCart";
import { useCart, useUpdateCartItem } from "../hooks/useCart";
import styles from "./AddToCartButton.module.css";

export interface AddToCartButtonProps {
  /** Variant to add. When omitted, the button renders disabled ("Unavailable"). */
  productVariantId?: number | null;
  /** Quantity to add per click. Defaults to 1. */
  quantity?: number;
  productId?: number;
  productName: string;
  productSlug?: string;
  imageUrl?: string | null;
  sku?: string;
  variantName?: string | null;
  /** Effective unit price for the variant (override or base price). */
  unitPrice: number;
  /** Known stock for the variant; undefined/null means untracked (no cap). */
  maxAvailableQuantity?: number;
  /** Compact rendering for product cards on the listing page. */
  size?: "default" | "compact";
  /** Show an "Only N left" hint under the control when stock is low. */
  showStockHint?: boolean;
}

/**
 * Industry-standard add-to-cart control:
 *  - while the variant is NOT in the cart: an "Add to Cart" button that flips
 *    to "Added ✓" for ~2s after a successful add (with an inline spinner while
 *    the request is in flight);
 *  - once the variant IS in the cart (per the shared ["cart"] cache): an inline
 *    quantity stepper (− [n] +) replacing the button, capped at the available
 *    stock.
 */
export default function AddToCartButton({
  productVariantId,
  quantity = 1,
  productId,
  productName,
  productSlug,
  imageUrl,
  sku,
  variantName,
  unitPrice,
  maxAvailableQuantity,
  size = "default",
  showStockHint = false,
}: AddToCartButtonProps) {
  const { data: cart } = useCart();
  const { addToCart, isPending, isJustAdded } = useAddToCart();
  const updateMutation = useUpdateCartItem();

  const cartItem = cart?.items?.find(
    (item) => item.productVariantId === productVariantId,
  );

  const effectiveMax = cartItem
    ? cartItem.maxAvailableQuantity
    : maxAvailableQuantity;
  const justAdded = productVariantId != null && isJustAdded(productVariantId);
  const updatingThis =
    updateMutation.isPending &&
    updateMutation.variables?.cartItemId === cartItem?.id;

  const stop = useCallback((event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleAdd = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      stop(event);
      if (productVariantId == null || isPending) return;
      addToCart({
        productVariantId,
        quantity,
        optimistic: {
          productId,
          productName,
          productSlug,
          imageUrl,
          sku,
          variantName,
          unitPrice,
          maxAvailableQuantity,
        },
      });
    },
    [
      addToCart,
      isPending,
      productVariantId,
      quantity,
      productId,
      productName,
      productSlug,
      imageUrl,
      sku,
      variantName,
      unitPrice,
      maxAvailableQuantity,
      stop,
    ],
  );

  const handleStep = useCallback(
    (event: MouseEvent<HTMLButtonElement>, nextQuantity: number) => {
      stop(event);
      if (!cartItem || updateMutation.isPending) return;
      if (nextQuantity < 1) return;
      if (nextQuantity > cartItem.maxAvailableQuantity) return;
      updateMutation.mutate({
        cartItemId: cartItem.id,
        quantity: nextQuantity,
      });
    },
    [cartItem, updateMutation, stop],
  );

  const lowStock =
    showStockHint &&
    effectiveMax != null &&
    effectiveMax > 0 &&
    effectiveMax <= 5;

  /* Already in cart (and past the "Added ✓" flash) → inline quantity stepper. */
  if (cartItem && !justAdded) {
    const atMax = cartItem.quantity >= cartItem.maxAvailableQuantity;
    const canDecrement = cartItem.quantity > 1;
    return (
      <div
        className={`${styles.root} ${styles.stepper} ${
          size === "compact" ? styles.compact : ""
        }`}
        onClick={stop}
      >
        <button
          type="button"
          className={styles.stepBtn}
          aria-label="Decrease quantity"
          disabled={!canDecrement || updatingThis}
          onClick={(event) => handleStep(event, cartItem.quantity - 1)}
        >
          −
        </button>

        <span className={styles.stepValue}>
          {updatingThis ? (
            <span className={styles.inlineSpinner} aria-hidden="true" />
          ) : (
            cartItem.quantity
          )}
        </span>

        <button
          type="button"
          className={styles.stepBtn}
          aria-label="Increase quantity"
          disabled={!cartItem.inStock || atMax || updatingThis}
          onClick={(event) => handleStep(event, cartItem.quantity + 1)}
        >
          +
        </button>

        {lowStock && (
          <span className={styles.stockHint}>Only {effectiveMax} left</span>
        )}
      </div>
    );
  }

  const addDisabled =
    productVariantId == null ||
    isPending ||
    (effectiveMax != null && quantity > effectiveMax);

  return (
    <div
      className={`${styles.root} ${size === "compact" ? styles.compact : ""}`}
    >
      <button
        type="button"
        className={styles.addBtn}
        disabled={addDisabled}
        onClick={handleAdd}
        title={
          productVariantId == null
            ? "This product has no purchasable variant"
            : undefined
        }
      >
        {isPending ? (
          <>
            <span className={styles.inlineSpinner} aria-hidden="true" />
            Adding…
          </>
        ) : justAdded ? (
          "Added ✓"
        ) : productVariantId == null ? (
          "Unavailable"
        ) : effectiveMax != null && quantity > effectiveMax ? (
          "Out of stock"
        ) : (
          "Add to Cart"
        )}
      </button>

      {lowStock && (
        <span className={styles.stockHint}>Only {effectiveMax} left</span>
      )}
    </div>
  );
}