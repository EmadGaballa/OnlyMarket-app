-- ============================================================
-- V4: Fix wishlist_items schema drift
--
-- The WishlistItem entity maps a @ManyToOne to Product via
-- @JoinColumn(name = "product_id"), but V1 erroneously created
-- the wishlist_items table with product_variant_id referencing
-- product_variants(id). This caused Hibernate schema validation
-- to fail at startup:
--   "Schema-validation: missing column [product_id] in table [wishlist_items]"
--
-- The wishlist feature operates on products, not variants (see
-- WishlistService.addItem(userId, productId) and
-- WishlistItemRepository.findByWishlistIdAndProductId). So the
-- correct column is product_id -> products(id).
-- ============================================================

-- Drop the erroneously-created variant FK column (the table-level
-- UNIQUE (wishlist_id, product_variant_id) constraint is dropped
-- automatically when its column is removed).
ALTER TABLE wishlist_items DROP COLUMN product_variant_id;

-- Add the product FK column the entity actually expects. ON DELETE
-- CASCADE keeps parity with the products FK in the favorites table.
ALTER TABLE wishlist_items ADD COLUMN product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE;

-- Restore the uniqueness guarantee at the (wishlist, product) level.
ALTER TABLE wishlist_items ADD CONSTRAINT uk_wishlist_items_wishlist_product UNIQUE (wishlist_id, product_id);