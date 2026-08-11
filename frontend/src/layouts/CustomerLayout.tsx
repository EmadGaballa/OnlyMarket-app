import {
  useState,
  useEffect,
  useRef,
  FormEvent,
  SVGProps,
} from "react";
import {
  Outlet,
  Link,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../hooks/useCart";
import { productsApi } from "../api/products";
import type { Category } from "../types/catalog";
import styles from "./CustomerLayout.module.css";

type IconProps = SVGProps<SVGSVGElement>;

/* -------------------------------------------------------------------------- */
/*  Helper functions to clean up and group category names                     */
/* -------------------------------------------------------------------------- */

// 1. Removes dashes "-" and capitalizes the first letter of every word
const formatCategoryName = (rawName: string): string => {
  if (!rawName) return "";
  return rawName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// 2. Maps small categories into bigger, broader category labels
const BROAD_CATEGORY_MAP: Record<string, string> = {
  fragrances: "Beauty & Fragrance",
  skincare: "Beauty & Fragrance",
  furniture: "Home & Furniture",
  "home-decoration": "Home & Furniture",
  "kitchen-accessories": "Home & Kitchen",
  laptops: "Electronics",
  smartphones: "Electronics",
  tablets: "Electronics",
  "mens-shirts": "Men's Fashion",
  "mens-shoes": "Men's Fashion",
  "mens-watches": "Men's Fashion",
  "womens-dresses": "Women's Fashion",
  "womens-shoes": "Women's Fashion",
  "womens-bags": "Women's Fashion",
  groceries: "Groceries",
};

// 3. Checks the map first; if not found, falls back to fixing dashes & caps
const getBroadCategoryName = (rawName: string): string => {
  const normalizedKey = rawName.toLowerCase().trim();
  if (BROAD_CATEGORY_MAP[normalizedKey]) {
    return BROAD_CATEGORY_MAP[normalizedKey];
  }
  return formatCategoryName(rawName);
};

export default function CustomerLayout() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const userDisplayName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
    : "";

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Category scroll container reference
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Unified URL Query Parameters Manager
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSearch = searchParams.get("search") || "";
  const activeCategoryId = searchParams.get("categoryId") || "";

  // Controlled input for search bar
  const [searchQuery, setSearchQuery] = useState(activeSearch);

  // Fetch real Categories from Backend API (matches ProductsPage)
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.listCategories,
  });

  // Shared cart cache — powers the header item-count badge. Auto-gated to
  // authenticated users inside the hook.
  const { data: cartData } = useCart();
  const cartItemCount = cartData?.itemCount ?? 0;

  // Keep search input synced with URL changes
  useEffect(() => {
    setSearchQuery(activeSearch);
  }, [activeSearch]);

  // Close menus on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  // Handle clicking outside profile dropdown & pressing Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileMenuOpen]);

  // Category Horizontal Smooth Scroll
  const handleScroll = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 280;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Helper function to update URL Search Parameters cleanly
  const updateQueryParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);

    if (value !== null && value !== "") {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    // Reset pagination to first page whenever filter/category changes
    next.set("page", "0");

    // If not on root catalog page, navigate to catalog root with new search params
    if (location.pathname !== "/") {
      navigate(`/?${next.toString()}`);
    } else {
      setSearchParams(next, { replace: true });
    }
  };

  // Handle Search submit
  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateQueryParam("search", searchQuery.trim() || null);
  };

  return (
    <div className={styles.layout} data-theme={theme}>
      {/* Accessibility Skip Link */}
      <a href="#main-content" className={styles.skipLink}>
        Skip to main content
      </a>

      {/* Top Banner Notice */}
      <div className={styles.topBar}>
        <p>⚡ Free worldwide shipping on orders over $50!</p>
      </div>

      {/* Main Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* Logo & Mobile Menu Toggle */}
          <div className={styles.brandGroup}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              <MenuIcon isOpen={isMobileMenuOpen} />
            </button>

            <Link to="/" className={styles.logo}>
              <StoreIcon className={styles.logoIcon} />
              <span>OnlyMarket</span>
            </Link>
          </div>

          {/* Search Bar */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products, brands, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button
              type="submit"
              className={styles.searchBtn}
              aria-label="Search"
            >
              <SearchIcon />
            </button>
          </form>

          {/* Header Action Nav */}
          <nav className={styles.headerActions}>
            <button
              onClick={toggleTheme}
              className={styles.iconBtn}
              title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
              aria-label="Toggle theme"
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/wishlist"
                  className={styles.iconNavLink}
                  title="Wishlist"
                >
                  <HeartIcon />
                  <span className={styles.mobileNavLabel}>Wishlist</span>
                </Link>

                <Link
                  to="/cart"
                  className={styles.iconNavLink}
                  title="Shopping Cart"
                >
                  <div className={styles.badgeWrapper}>
                    <CartIcon />
                    {cartItemCount > 0 && (
                      <span
                        className={styles.cartBadge}
                        title={`${cartItemCount} ${
                          cartItemCount === 1 ? "item" : "items"
                        } in cart`}
                      >
                        {cartItemCount > 99 ? "99+" : cartItemCount}
                      </span>
                    )}
                  </div>
                  <span className={styles.mobileNavLabel}>Cart</span>
                </Link>

                {/* Profile Dropdown */}
                <div
                  ref={profileDropdownRef}
                  className={styles.profileDropdownContainer}
                >
                  <button
                    className={styles.profileBtn}
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    aria-expanded={isProfileMenuOpen}
                    aria-haspopup="true"
                  >
                    <div className={styles.avatar}>
                      {userDisplayName ? (
                        userDisplayName.charAt(0).toUpperCase()
                      ) : (
                        <UserIcon />
                      )}
                    </div>
                    <span className={styles.profileName}>
                      {userDisplayName || "Account"}
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div className={styles.dropdownMenu} role="menu">
                      <div className={styles.dropdownHeader}>
                        <p className={styles.userName}>
                          {userDisplayName || "User"}
                        </p>
                        <p className={styles.userEmail}>{user?.email || ""}</p>
                      </div>
                      <hr className={styles.divider} />
                      <Link
                        to="/profile"
                        className={styles.dropdownItem}
                        role="menuitem"
                      >
                        Profile & Orders
                      </Link>
                      <Link
                        to="/favorites"
                        className={styles.dropdownItem}
                        role="menuitem"
                      >
                        Favorite Sellers
                      </Link>
                      <hr className={styles.divider} />
                      <button
                        onClick={logout}
                        className={`${styles.dropdownItem} ${styles.logoutBtn}`}
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.authGroup}>
                <Link to="/login" className={styles.loginBtn}>
                  Login
                </Link>
                <Link to="/register" className={styles.registerBtn}>
                  Register
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Dynamic Category Navigation Bar with Scroll Arrows */}
        <nav
          className={`${styles.categoryNav} ${
            isMobileMenuOpen ? styles.mobileNavOpen : ""
          }`}
          aria-label="Category Navigation"
        >
          <div className={styles.categoryNavInner}>
            <div className={styles.categoryNavWrapper}>
              <button
                type="button"
                className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
                onClick={() => handleScroll("left")}
                aria-label="Scroll categories left"
              >
                <ChevronLeftIcon />
              </button>

              <div className={styles.categoryLinks} ref={categoryScrollRef}>
                {/* All Products Default Filter */}
                <button
                  type="button"
                  className={`${styles.navLink} ${
                    !activeCategoryId ? styles.activeNavLink : ""
                  }`}
                  onClick={() => updateQueryParam("categoryId", null)}
                >
                  All Products
                </button>

                {/* API Dynamically Loaded Categories */}
                {/* API Dynamically Loaded Categories */}
                {categories?.map((cat: Category) => {
                  const isActive = String(cat.id) === activeCategoryId;

                  // Converts "mens-shoes" -> "Men's Fashion" or "Mens Shoes"
                  const displayName = getBroadCategoryName(cat.name);

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`${styles.navLink} ${
                        isActive ? styles.activeNavLink : ""
                      }`}
                      onClick={() =>
                        updateQueryParam("categoryId", String(cat.id))
                      }
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
                onClick={() => handleScroll("right")}
                aria-label="Scroll categories right"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {isAuthenticated && (
              <div className={styles.mobileOnlyLinks}>
                <hr className={styles.divider} />
                <Link to="/cart" className={styles.navLink}>
                  My Cart
                </Link>
                <Link to="/wishlist" className={styles.navLink}>
                  Wishlist
                </Link>
                <Link to="/profile" className={styles.navLink}>
                  Profile Settings
                </Link>
                <button onClick={logout} className={styles.mobileLogoutBtn}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content Viewport */}
      <main id="main-content" className={styles.main}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <h3 className={styles.footerHeading}>OnlyMarket</h3>
            <p className={styles.footerDesc}>
              Your modern destination for quality products, fast delivery, and
              seamless online shopping.
            </p>
          </div>

          <div className={styles.footerCol}>
            <h4>Quick Links</h4>
            <ul>
              <li>
                <Link to="/">Shop Catalog</Link>
              </li>
              <li>
                <Link to="/cart">Shopping Cart</Link>
              </li>
              <li>
                <Link to="/wishlist">Your Wishlist</Link>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Customer Support</h4>
            <ul>
              <li>
                <a href="#help">Help & FAQ</a>
              </li>
              <li>
                <a href="#shipping">Shipping & Returns</a>
              </li>
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
            </ul>
          </div>

          <div className={styles.footerCol}>
            <h4>Connect</h4>
            <p className={styles.supportText}>
              Questions? Reach out to our support team 24/7.
            </p>
            <a
              href="mailto:support@shopplatform.com"
              className={styles.supportLink}
            >
              support@shopplatform.com
            </a>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} OnlyMarket. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

/* Icons */
function StoreIcon(props: IconProps) {
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
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
    </svg>
  );
}

function SearchIcon(props: IconProps) {
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
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CartIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

function HeartIcon(props: IconProps) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function UserIcon(props: IconProps) {
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
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function SunIcon(props: IconProps) {
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
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props: IconProps) {
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
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
}

function ChevronLeftIcon(props: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon(props: IconProps) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function MenuIcon({ isOpen, ...props }: { isOpen: boolean } & IconProps) {
  return isOpen ? (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ) : (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}
