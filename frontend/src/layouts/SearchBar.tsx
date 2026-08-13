import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "../api/products";
import type { Product, Category, Brand } from "../types/catalog";
import styles from "./SearchBar.module.css";

export interface SearchSuggestions {
  products: Product[];
  brands: Brand[];
  categories: Category[];
}

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

const RECENT_SEARCHES_KEY = "app_recent_searches";
const MAX_RECENT_SEARCHES = 5;

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search products, brands, categories...",
}) => {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [suggestions, setSuggestions] = useState<SearchSuggestions>({
    products: [],
    brands: [],
    categories: [],
  });

  const flatItems = React.useMemo(() => {
    if (!query.trim()) {
      return recentSearches.map((item) => ({ type: "recent", label: item }));
    }
    const items: Array<{
      type: "product" | "brand" | "category";
      label: string;
      url?: string;
    }> = [];

    suggestions.products.forEach((p) =>
      items.push({
        type: "product",
        label: p.name,
        url: `/products/${p.slug || p.id}`,
      }),
    );
    suggestions.brands.forEach((b) =>
      items.push({ type: "brand", label: b.name, url: `/?brandId=${b.id}` }),
    );
    suggestions.categories.forEach((c) =>
      items.push({
        type: "category",
        label: c.name,
        url: `/?categoryId=${c.id}`,
      }),
    );

    return items;
  }, [query, suggestions, recentSearches]);

  const { data: allCategories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: productsApi.listCategories,
  });

  const { data: allBrands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: productsApi.listBrands,
  });

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions({ products: [], brands: [], categories: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    const lower = trimmed.toLowerCase();
    const timer = setTimeout(async () => {
      try {
        const result = await productsApi.list({ search: trimmed, size: 5 });
        const fetchedProducts = Array.isArray(result)
          ? result
          : result?.content || [];

        setSuggestions({
          products: fetchedProducts,
          brands: allBrands
            .filter((b) => b.name?.toLowerCase().includes(lower))
            .slice(0, 5),
          categories: allCategories
            .filter((c) => c.name?.toLowerCase().includes(lower))
            .slice(0, 5),
        });
      } catch (err) {
        console.error("Failed to fetch suggestions", err);
        setSuggestions({ products: [], brands: [], categories: [] });
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, allCategories, allBrands]);

  // Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save query to recent searches
  const saveRecentSearch = (searchTerm: string) => {
    if (!searchTerm?.trim()) return;
    const cleaned = searchTerm.trim();
    const updated = [
      cleaned,
      ...recentSearches.filter((s) => s !== cleaned),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== item);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  // Submit Execution
  const executeSearch = useCallback(
    (searchTerm?: string, destinationUrl?: string) => {
      if (!searchTerm?.trim()) return;

      const cleaned = searchTerm.trim();
      saveRecentSearch(cleaned);
      setIsOpen(false);
      inputRef.current?.blur();

      if (destinationUrl) {
        navigate(destinationUrl);
      } else if (onSearch) {
        onSearch(cleaned);
      } else {
        navigate(`/search?q=${encodeURIComponent(cleaned)}`);
      }
    },
    [navigate, onSearch, recentSearches],
  );

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (highlightedIndex >= 0 && flatItems[highlightedIndex]) {
      const selected = flatItems[highlightedIndex];
      executeSearch(selected.label, selected.url);
    } else {
      executeSearch(query);
    }
  };

  // Keyboard Navigation Logic
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < flatItems.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : flatItems.length - 1,
        );
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Enter":
        setHighlightedIndex(-1);
        break;
    }
  };

  const clearQuery = () => {
    setQuery("");
    setSuggestions({ products: [], brands: [], categories: [] });
    inputRef.current?.focus();
  };

  return (
    <div className={styles.searchWrapper} ref={wrapperRef}>
      <form
        className={styles.searchForm}
        onSubmit={handleFormSubmit}
        role="search"
      >
        <div className={styles.inputContainer}>
          <SearchIcon className={styles.searchIcon} />

          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder={placeholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-controls="search-suggestions-dropdown"
          />

          {loading ? (
            <div className={styles.spinner} />
          ) : query ? (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={clearQuery}
              aria-label="Clear search query"
            >
              ✕
            </button>
          ) : null}
        </div>

        <button
          type="submit"
          className={styles.searchBtn}
          aria-label="Submit search"
        >
          <SearchIcon className={styles.searchBtnIcon} />
          <span className={styles.searchBtnLabel}>Search</span>
        </button>
      </form>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div
          id="search-suggestions-dropdown"
          className={styles.dropdown}
          role="listbox"
        >
          {/* Recent Searches */}
          {!query.trim() && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>Recent Searches</div>
              {recentSearches.length === 0 ? (
                <div className={styles.emptyText}>No recent searches</div>
              ) : (
                recentSearches.map((item, idx) => {
                  const isHighlighted = highlightedIndex === idx;
                  return (
                    <div
                      key={item}
                      className={`${styles.suggestionRow} ${isHighlighted ? styles.highlighted : ""}`}
                      onClick={() => executeSearch(item)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      role="option"
                      aria-selected={isHighlighted}
                    >
                      <HistoryIcon className={styles.rowIcon} />
                      <span className={styles.rowLabel}>{item}</span>
                      <button
                        type="button"
                        className={styles.removeHistoryBtn}
                        onClick={(e) => removeRecentSearch(e, item)}
                        title="Remove from history"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* No Results State */}
          {query.trim() !== "" && !loading && flatItems.length === 0 && (
            <div className={styles.noResults}>
              No results found for "<strong>{query}</strong>"
            </div>
          )}

          {/* Live Search Results */}
          {query.trim() !== "" && flatItems.length > 0 && (
            <>
              {/* Products */}
              {suggestions.products.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>Products</div>
                  {suggestions.products.map((product) => {
                    const itemIndex = flatItems.findIndex(
                      (i) => i.type === "product" && i.label === product.name,
                    );
                    const isHighlighted = highlightedIndex === itemIndex;
                    const categoryLabel =
                      typeof product.category === "object"
                        ? (product.category as Category)?.name
                        : product.category;

                    return (
                      <div
                        key={`p-${product.id}`}
                        className={`${styles.suggestionRow} ${isHighlighted ? styles.highlighted : ""}`}
                        onClick={() =>
                          executeSearch(
                            product.name,
                            `/products/${product.slug || product.id}`,
                          )
                        }
                        onMouseEnter={() => setHighlightedIndex(itemIndex)}
                        role="option"
                        aria-selected={isHighlighted}
                      >
                        <ProductIcon className={styles.rowIcon} />
                        <span className={styles.rowLabel}>{product.name}</span>
                        {categoryLabel && (
                          <span className={styles.badge}>{categoryLabel}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Brands */}
              {suggestions.brands.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>Brands</div>
                  {suggestions.brands.map((brand) => {
                    const itemIndex = flatItems.findIndex(
                      (i) => i.type === "brand" && i.label === brand.name,
                    );
                    const isHighlighted = highlightedIndex === itemIndex;
                    return (
                      <div
                        key={`b-${brand.id}`}
                        className={`${styles.suggestionRow} ${isHighlighted ? styles.highlighted : ""}`}
                        onClick={() =>
                          executeSearch(brand.name, `/?brandId=${brand.id}`)
                        }
                        onMouseEnter={() => setHighlightedIndex(itemIndex)}
                        role="option"
                        aria-selected={isHighlighted}
                      >
                        <TagIcon className={styles.rowIcon} />
                        <span className={styles.rowLabel}>{brand.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Categories */}
              {suggestions.categories.length > 0 && (
                <div className={styles.section}>
                  <div className={styles.sectionHeader}>Categories</div>
                  {suggestions.categories.map((cat) => {
                    const itemIndex = flatItems.findIndex(
                      (i) => i.type === "category" && i.label === cat.name,
                    );
                    const isHighlighted = highlightedIndex === itemIndex;
                    return (
                      <div
                        key={`c-${cat.id}`}
                        className={`${styles.suggestionRow} ${isHighlighted ? styles.highlighted : ""}`}
                        onClick={() =>
                          executeSearch(cat.name, `/?categoryId=${cat.id}`)
                        }
                        onMouseEnter={() => setHighlightedIndex(itemIndex)}
                        role="option"
                        aria-selected={isHighlighted}
                      >
                        <CategoryIcon className={styles.rowIcon} />
                        <span className={styles.rowLabel}>{cat.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Inline Helper Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const HistoryIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <polyline points="12 8 12 12 14 14" />
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const ProductIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const CategoryIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);
