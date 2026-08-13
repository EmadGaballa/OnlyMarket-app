-- V7: Orders, order items and coupons for the checkout flow.
--
-- NOTE: V1 originally defined orders/order_items/coupons (plus payments,
-- invoices, order_status_history) as part of an aspirational "master schema",
-- but the running application never used them. This migration drops those
-- unused legacy tables and recreates orders/order_items/coupons to match the
-- new Order domain exactly (address FK, payment method, card brand/last4,
-- coupon code, snapshots). No Java entity maps to the dropped legacy tables,
-- so removal is safe; the reviews.order_item_id FK is cascaded away but the
-- column (always NULL in seed data) remains.

DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------
CREATE TABLE orders (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    address_id       BIGINT NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
    status           VARCHAR(20) NOT NULL DEFAULT 'PREPARING',
    subtotal         NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total            NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    payment_method   VARCHAR(30) NOT NULL,
    card_brand       VARCHAR(20),
    card_last4       VARCHAR(4),
    coupon_code      VARCHAR(50),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- ------------------------------------------------------------
-- Order items (snapshot of the cart at order time)
-- ------------------------------------------------------------
CREATE TABLE order_items (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id              BIGINT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name_snapshot   VARCHAR(255) NOT NULL,
    product_image_snapshot  VARCHAR(500),
    unit_price              NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity                INTEGER NOT NULL CHECK (quantity > 0)
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ------------------------------------------------------------
-- Coupons
-- ------------------------------------------------------------
CREATE TABLE coupons (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    discount_type   VARCHAR(20) NOT NULL,
    discount_value  NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
    active          BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at      TIMESTAMPTZ
);
CREATE INDEX idx_coupons_code ON coupons(code);