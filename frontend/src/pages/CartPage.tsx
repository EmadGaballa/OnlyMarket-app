import type { SVGProps } from "react";
import { Link } from "react-router-dom";
import {
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "../hooks/useCart";
import styles from "./CartPage.module.css";

export default function CartPage() {
  const { data: cart, isLoading, error, refetch } = useCart();

  const items = cart?.items ?? [];

  const updateMutation = useUpdateCartItem();
  const removeMutation = useRemoveCartItem();
  const clearMutation = useClearCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  // Server-computed totals (CartResponse.subtotal / itemCount) are the source
  // of truth. We only recompute client-side as a defensive fallback.
  const fallbackSubtotal = items.reduce(
    (sum, item) =>
      sum +
      (item.lineTotal ?? (item.unitPrice ?? 0) * (item.quantity ?? 1)),
    0,
  );
  const subtotal =
    cart && typeof cart.subtotal === "number" ? cart.subtotal : fallbackSubtotal;
  const itemCount =
    cart && typeof cart.itemCount === "number"
      ? cart.itemCount
      : items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);

  const freeShippingThreshold = 75;
  const shippingFee =
    subtotal >= freeShippingThreshold || items.length === 0 ? 0 : 7.99;
  const total = subtotal + shippingFee;

  const handleQuantityChange = (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateMutation.mutate({ cartItemId, quantity: newQuantity });
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>
          <SpinnerIcon className={styles.spinner} />
          <p>Fetching your shopping cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard} role="alert">
          <AlertIcon className={styles.errorIcon} />
          <h2>Failed to load cart</h2>
          <p>
            {error instanceof Error
              ? error.message
              : "An unexpected error occurred."}
          </p>
          <button onClick={() => refetch()} className={styles.retryBtn}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.headerGroup}>
          <div className={styles.titleRow}>
            <h1>Your Cart</h1>
            <span className={styles.itemCount}>
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>
          <p className={styles.subtitle}>
            Review your selected items and proceed to secure checkout
          </p>
        </header>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <ShoppingBagIcon className={styles.emptyIcon} />
            </div>
            <h2>Your cart is currently empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/products" className={styles.shopBtn}>
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Main Cart Content Grid */
          <div className={styles.cartGrid}>
            {/* Items List */}
            <section className={styles.cartItemsSection}>
              {subtotal < freeShippingThreshold && (
                <div className={styles.shippingBanner}>
                  <p>
                    Add{" "}
                    <strong>
                      {formatPrice(freeShippingThreshold - subtotal)}
                    </strong>{" "}
                    more to qualify for <strong>Free Shipping</strong>!
                  </p>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className={styles.cartList}>
                {items.map((item) => {
                  const isUpdating =
                    updateMutation.isPending &&
                    updateMutation.variables?.cartItemId === item.id;
                  const isRemoving =
                    removeMutation.isPending &&
                    removeMutation.variables === item.id;
                  const productHref = item.productSlug
                    ? `/products/${item.productSlug}`
                    : null;
                  const atMax = item.quantity >= item.maxAvailableQuantity;

                  return (
                    <article key={item.id} className={styles.cartItem}>
                      {/* Product Thumbnail (links to the product detail page) */}
                      {productHref ? (
                        <Link to={productHref} className={styles.imageLink}>
                          <div className={styles.imageWrapper}>
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                loading="lazy"
                              />
                            ) : (
                              <div className={styles.placeholder}>
                                <ImageIcon />
                              </div>
                            )}
                          </div>
                        </Link>
                      ) : (
                        <div className={styles.imageLink}>
                          <div className={styles.imageWrapper}>
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                loading="lazy"
                              />
                            ) : (
                              <div className={styles.placeholder}>
                                <ImageIcon />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Item Details */}
                      <div className={styles.itemContent}>
                        <div className={styles.itemHeader}>
                          {productHref ? (
                            <Link
                              to={productHref}
                              className={styles.productTitleLink}
                            >
                              <h3 className={styles.productName}>
                                {item.productName}
                              </h3>
                            </Link>
                          ) : (
                            <h3 className={styles.productName}>
                              {item.productName}
                            </h3>
                          )}

                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => removeMutation.mutate(item.id)}
                            disabled={isRemoving || isUpdating}
                            aria-label={`Remove ${item.productName} from cart`}
                            title="Remove item"
                          >
                            {isRemoving ? (
                              <SpinnerIcon className={styles.miniSpinner} />
                            ) : (
                              <TrashIcon />
                            )}
                          </button>
                        </div>

                        {item.variantName && (
                          <span className={styles.variantTag}>
                            {item.variantName}
                          </span>
                        )}

                        {/* Stock / availability warning */}
                        {!item.inStock ? (
                          <span className={styles.stockWarning}>
                            Out of stock
                          </span>
                        ) : item.maxAvailableQuantity > 0 &&
                          item.maxAvailableQuantity <= 5 ? (
                          <span className={styles.stockWarning}>
                            Only {item.maxAvailableQuantity} left
                          </span>
                        ) : null}

                        <div className={styles.itemFooter}>
                          <p className={styles.unitPrice}>
                            {formatPrice(item.unitPrice)} each
                          </p>

                          {/* Quantity Controls */}
                          <div className={styles.quantityControl}>
                            <button
                              type="button"
                              className={styles.qtyBtn}
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity - 1)
                              }
                              disabled={
                                item.quantity <= 1 ||
                                isUpdating ||
                                isRemoving ||
                                !item.inStock
                              }
                              aria-label="Decrease quantity"
                            >
                              <MinusIcon />
                            </button>

                            <span className={styles.qtyValue}>
                              {isUpdating ? (
                                <SpinnerIcon className={styles.miniSpinner} />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              type="button"
                              className={styles.qtyBtn}
                              onClick={() =>
                                handleQuantityChange(item.id, item.quantity + 1)
                              }
                              disabled={
                                isUpdating || isRemoving || !item.inStock || atMax
                              }
                              aria-label="Increase quantity"
                            >
                              <PlusIcon />
                            </button>
                          </div>

                          {/* Line Total */}
                          <p className={styles.itemTotal}>
                            {formatPrice(item.lineTotal)}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className={styles.cartActionsRow}>
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => clearMutation.mutate()}
                  disabled={clearMutation.isPending}
                >
                  {clearMutation.isPending ? (
                    <>
                      <SpinnerIcon className={styles.miniSpinner} /> Clearing...
                    </>
                  ) : (
                    <>
                      <TrashIcon /> Clear Cart
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Order Summary Sidebar */}
            <aside className={styles.summarySidebar}>
              <div className={styles.summaryCard}>
                <h2>Order Summary</h2>

                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal ({itemCount} items)</span>
                    <span className={styles.rowValue}>
                      {formatPrice(subtotal)}
                    </span>
                  </div>

                  <div className={styles.summaryRow}>
                    <span>Estimated Shipping</span>
                    <span className={styles.rowValue}>
                      {shippingFee === 0 ? (
                        <span className={styles.freeText}>FREE</span>
                      ) : (
                        formatPrice(shippingFee)
                      )}
                    </span>
                  </div>

                  <hr className={styles.divider} />

                  <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                    <span>Total</span>
                    <span className={styles.totalValue}>
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>

                <Link to="/checkout" className={styles.checkoutBtn}>
                  <LockIcon /> Proceed to Checkout
                </Link>

                <div className={styles.trustBadge}>
                  <ShieldIcon />
                  <span>Encrypted 256-bit SSL Checkout</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

/* Accessible Inline SVG Icons */
function ShoppingBagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function ImageIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function AlertIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}

function SpinnerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
