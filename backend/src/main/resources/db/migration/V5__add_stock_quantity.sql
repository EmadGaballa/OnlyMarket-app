-- V5: Add per-variant stock quantity used by the cart flow to cap quantities
-- and surface "Only N left" warnings. NULL means stock is untracked (unlimited).
ALTER TABLE product_variants
    ADD COLUMN IF NOT EXISTS stock_quantity INTEGER;