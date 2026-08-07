-- ============================================================
-- Enterprise E-Commerce Platform — Initial Schema (V1)
-- Implements Section 7 of the master build specification.
-- Fully normalized (3NF) with one deliberate denormalization
-- (products.average_rating / products.review_count).
-- ============================================================

-- ------------------------------------------------------------
-- Core: users, roles, permissions, addresses, seller_profiles
-- ------------------------------------------------------------

CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    phone           VARCHAR(30),
    is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE roles (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE permissions (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE role_permissions (
    role_id         BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id   BIGINT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id     BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE addresses (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       VARCHAR(50) NOT NULL,
    line1       VARCHAR(255) NOT NULL,
    line2       VARCHAR(255),
    city        VARCHAR(100) NOT NULL,
    state       VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country     VARCHAR(100) NOT NULL,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user_id ON addresses(user_id);

CREATE TABLE seller_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_name      VARCHAR(150) NOT NULL,
    store_description TEXT,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_seller_profiles_approval_status ON seller_profiles(approval_status);

-- ------------------------------------------------------------
-- Catalog: brands, categories, products, images, attributes,
-- variants
-- ------------------------------------------------------------

CREATE TABLE brands (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    external_id BIGINT
);

CREATE TABLE categories (
    id                  BIGSERIAL PRIMARY KEY,
    name                VARCHAR(150) NOT NULL UNIQUE,
    parent_category_id  BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    slug                VARCHAR(180) NOT NULL UNIQUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE products (
    id              BIGSERIAL PRIMARY KEY,
    seller_id       BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    brand_id        BIGINT REFERENCES brands(id) ON DELETE RESTRICT,
    category_id     BIGINT REFERENCES categories(id) ON DELETE RESTRICT,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(280) NOT NULL UNIQUE,
    description     TEXT NOT NULL,
    base_price      NUMERIC(12,2) NOT NULL CHECK (base_price >= 0),
    cost_price      NUMERIC(12,2) CHECK (cost_price >= 0),
    sku             VARCHAR(100) NOT NULL UNIQUE,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    external_id     BIGINT,
    average_rating  NUMERIC(3,2) NOT NULL DEFAULT 0 CHECK (average_rating BETWEEN 0 AND 5),
    review_count    INTEGER NOT NULL DEFAULT 0 CHECK (review_count >= 0),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_external_id ON products(external_id);

-- pg_trgm GIN index for product search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING GIN (description gin_trgm_ops);

CREATE TABLE product_images (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url             VARCHAR(500) NOT NULL,
    display_order   INTEGER NOT NULL DEFAULT 0,
    alt_text        VARCHAR(255)
);

CREATE TABLE product_attributes (
    id      BIGSERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE product_variants (
    id               BIGSERIAL PRIMARY KEY,
    product_id       BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku              VARCHAR(100) NOT NULL UNIQUE,
    price_override   NUMERIC(12,2) CHECK (price_override >= 0),
    attributes_json  JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);

-- ------------------------------------------------------------
-- Inventory
-- ------------------------------------------------------------

CREATE TABLE warehouses (
    id            BIGSERIAL PRIMARY KEY,
    name          VARCHAR(150) NOT NULL,
    address_line1 VARCHAR(255) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) NOT NULL,
    postal_code   VARCHAR(20) NOT NULL,
    country       VARCHAR(100) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory_records (
    id                  BIGSERIAL PRIMARY KEY,
    product_variant_id  BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    warehouse_id        BIGINT NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity_on_hand    INTEGER NOT NULL DEFAULT 0 CHECK (quantity_on_hand >= 0),
    quantity_reserved   INTEGER NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
    low_stock_threshold INTEGER NOT NULL DEFAULT 5 CHECK (low_stock_threshold >= 0),
    version             BIGINT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (product_variant_id, warehouse_id)
);

CREATE TABLE inventory_adjustments (
    id                  BIGSERIAL PRIMARY KEY,
    inventory_record_id BIGINT NOT NULL REFERENCES inventory_records(id) ON DELETE CASCADE,
    delta               INTEGER NOT NULL,
    reason              VARCHAR(30) NOT NULL,
    reference_order_id  BIGINT,
    created_by_user_id  BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_inventory_adjustments_record ON inventory_adjustments(inventory_record_id);

-- ------------------------------------------------------------
-- Commerce: carts, wishlists, favorites
-- ------------------------------------------------------------

CREATE TABLE carts (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id                  BIGSERIAL PRIMARY KEY,
    cart_id             BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_variant_id  BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (cart_id, product_variant_id)
);

CREATE TABLE wishlists (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wishlist_items (
    id                  BIGSERIAL PRIMARY KEY,
    wishlist_id         BIGINT NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    product_variant_id  BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (wishlist_id, product_variant_id)
);

CREATE TABLE favorites (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- ------------------------------------------------------------
-- Orders
-- ------------------------------------------------------------

CREATE TABLE orders (
    id                  BIGSERIAL PRIMARY KEY,
    order_number        VARCHAR(30) NOT NULL UNIQUE,
    customer_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    shipping_address_id BIGINT REFERENCES addresses(id) ON DELETE RESTRICT,
    billing_address_id  BIGINT REFERENCES addresses(id) ON DELETE RESTRICT,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    subtotal            NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_total      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
    shipping_total      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
    tax_total           NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
    grand_total         NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
    placed_at           TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

CREATE TABLE order_items (
    id                      BIGSERIAL PRIMARY KEY,
    order_id                BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seller_id               BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    product_variant_id      BIGINT NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
    product_name_snapshot   VARCHAR(255) NOT NULL,
    unit_price_snapshot     NUMERIC(12,2) NOT NULL CHECK (unit_price_snapshot >= 0),
    quantity                INTEGER NOT NULL CHECK (quantity > 0),
    line_total              NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
    coupon_code_snapshot    VARCHAR(50)
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_seller_id ON order_items(seller_id);

CREATE TABLE order_status_history (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status         VARCHAR(20),
    to_status           VARCHAR(20) NOT NULL,
    changed_by_user_id  BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    note                TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

CREATE TABLE payments (
    id                  BIGSERIAL PRIMARY KEY,
    order_id            BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    provider            VARCHAR(30) NOT NULL DEFAULT 'SIMULATED',
    provider_reference  VARCHAR(100),
    amount              NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    captured_at         TIMESTAMPTZ,
    refunded_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id              BIGSERIAL PRIMARY KEY,
    order_id        BIGINT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
    invoice_number  VARCHAR(30) NOT NULL UNIQUE,
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pdf_url         VARCHAR(500)
);

-- ------------------------------------------------------------
-- Promotions
-- ------------------------------------------------------------

CREATE TABLE coupons (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(50) NOT NULL UNIQUE,
    seller_id       BIGINT REFERENCES users(id) ON DELETE RESTRICT,
    discount_type   VARCHAR(20) NOT NULL,
    discount_value  NUMERIC(12,2) NOT NULL CHECK (discount_value > 0),
    min_order_amount NUMERIC(12,2) DEFAULT 0 CHECK (min_order_amount >= 0),
    max_uses        INTEGER DEFAULT NULL CHECK (max_uses IS NULL OR max_uses > 0),
    uses_count      INTEGER NOT NULL DEFAULT 0 CHECK (uses_count >= 0),
    valid_from      TIMESTAMPTZ,
    valid_until     TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coupons_seller_id ON coupons(seller_id);

-- ------------------------------------------------------------
-- Reviews
-- ------------------------------------------------------------

CREATE TABLE reviews (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_item_id   BIGINT REFERENCES order_items(id) ON DELETE SET NULL,
    rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title           VARCHAR(200),
    body            TEXT NOT NULL,
    is_seed_data    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (product_id, user_id)
);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ------------------------------------------------------------
-- Notifications, Audit, Settings
-- ------------------------------------------------------------

CREATE TABLE notifications (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(30) NOT NULL,
    title       VARCHAR(200) NOT NULL,
    body        TEXT,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

CREATE TABLE audit_logs (
    id              BIGSERIAL PRIMARY KEY,
    actor_user_id   BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    action          VARCHAR(100) NOT NULL,
    target_type     VARCHAR(50),
    target_id       BIGINT,
    metadata_json   JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Audit logs are append-only: revoke UPDATE/DELETE for app role in prod
-- (documented in DECISIONS.md; the app DB role should be granted only INSERT/SELECT)

CREATE TABLE system_settings (
    id          BIGSERIAL PRIMARY KEY,
    key         VARCHAR(100) NOT NULL UNIQUE,
    value       TEXT NOT NULL,
    value_type  VARCHAR(20) NOT NULL DEFAULT 'STRING',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Refresh tokens (auth)
-- ------------------------------------------------------------

CREATE TABLE refresh_tokens (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash              VARCHAR(255) NOT NULL UNIQUE,
    expires_at              TIMESTAMPTZ NOT NULL,
    revoked_at              TIMESTAMPTZ,
    replaced_by_token_id    BIGINT REFERENCES refresh_tokens(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);