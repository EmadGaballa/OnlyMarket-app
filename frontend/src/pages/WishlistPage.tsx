import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { wishlistApi } from "../api/wishlist";
import styles from "./WishlistPage.module.css";

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.list,
  });

  // Guarantee items is ALWAYS an array regardless of API payload anomalies
  const items = Array.isArray(data) ? data : [];

  const removeMutation = useMutation({
    mutationFn: (productId: number) => wishlistApi.removeItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingCard}>
          <SpinnerIcon className={styles.spinner} />
          <p>Loading your saved items...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorCard} role="alert">
          <AlertIcon className={styles.errorIcon} />
          <h2>Failed to load wishlist</h2>
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
            <h1>My Wishlist</h1>
            <span className={styles.itemCount}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <p className={styles.subtitle}>
            Keep track of items you love and save them for later
          </p>
        </header>

        {/* Empty State */}
        {items.length === 0 ? (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrapper}>
              <HeartIcon className={styles.emptyIcon} />
            </div>
            <h2>Your wishlist is empty</h2>
            <p>Looks like you haven't added anything to your wishlist yet.</p>
            <Link to="/products" className={styles.shopBtn}>
              Explore Products
            </Link>
          </div>
        ) : (
          /* Wishlist Grid */
          <div className={styles.productGrid}>
            {items.map((item) => {
              const isRemoving =
                removeMutation.isPending &&
                removeMutation.variables === item.productId;

              return (
                <article key={item.id} className={styles.productCard}>
                  {/* Remove Button Overlay */}
                  <button
                    type="button"
                    className={styles.removeBadgeBtn}
                    onClick={() => removeMutation.mutate(item.productId)}
                    disabled={isRemoving}
                    aria-label={`Remove ${item.product?.name ?? "item"} from wishlist`}
                    title="Remove item"
                  >
                    {isRemoving ? (
                      <SpinnerIcon className={styles.miniSpinner} />
                    ) : (
                      <TrashIcon />
                    )}
                  </button>

                  <Link
                    to={`/products/${item.product?.slug ?? ""}`}
                    className={styles.imageLink}
                  >
                    <div className={styles.imageWrapper}>
                      {item.product?.images?.[0]?.url ? (
                        <img
                          src={item.product.images[0].url}
                          alt={item.product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.placeholder}>
                          <ImageIcon />
                          <span>No Image Available</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className={styles.productDetails}>
                    <Link
                      to={`/products/${item.product?.slug ?? ""}`}
                      className={styles.titleLink}
                    >
                      <h3 className={styles.productName}>
                        {item.product?.name ?? "Product"}
                      </h3>
                    </Link>

                    <p className={styles.price}>
                      {formatPrice(item.product?.basePrice ?? 0)}
                    </p>

                    <div className={styles.actionsRow}>
                      <Link
                        to={`/products/${item.product?.slug ?? ""}`}
                        className={styles.viewBtn}
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* Accessible Inline SVG Icons */
function HeartIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
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

function ImageIcon(props: React.SVGProps<SVGSVGElement>) {
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

function AlertIcon(props: React.SVGProps<SVGSVGElement>) {
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

function SpinnerIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="28"
      height="28"
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
