package com.platform.ecommerce.user;

/**
 * Central registry of all permission names in the system.
 *
 * <p>Using string constants here (rather than an enum) keeps the names
 * directly usable in {@code @PreAuthorize("hasAuthority('...')")} SpEL
 * expressions and in DB seeding, while giving compile-time safety for
 * Java-side references.</p>
 */
public final class Permissions {

  private Permissions() {}

  // ---- Product permissions ----
  public static final String PRODUCT_CREATE = "PRODUCT_CREATE";
  public static final String PRODUCT_EDIT_OWN = "PRODUCT_EDIT_OWN";
  public static final String PRODUCT_EDIT_ANY = "PRODUCT_EDIT_ANY";
  public static final String PRODUCT_DELETE_OWN = "PRODUCT_DELETE_OWN";
  public static final String PRODUCT_DELETE_ANY = "PRODUCT_DELETE_ANY";
  public static final String PRODUCT_IMPORT = "PRODUCT_IMPORT";

  // ---- Catalog permissions ----
  public static final String CATEGORY_MANAGE = "CATEGORY_MANAGE";
  public static final String BRAND_MANAGE = "BRAND_MANAGE";

  // ---- Inventory permissions ----
  public static final String INVENTORY_VIEW_OWN = "INVENTORY_VIEW_OWN";
  public static final String INVENTORY_VIEW_ANY = "INVENTORY_VIEW_ANY";
  public static final String INVENTORY_MANAGE_OWN = "INVENTORY_MANAGE_OWN";
  public static final String INVENTORY_MANAGE_ANY = "INVENTORY_MANAGE_ANY";
  public static final String WAREHOUSE_MANAGE = "WAREHOUSE_MANAGE";

  // ---- Order permissions ----
  public static final String ORDER_VIEW_OWN = "ORDER_VIEW_OWN";
  public static final String ORDER_VIEW_ANY = "ORDER_VIEW_ANY";
  public static final String ORDER_STATUS_UPDATE = "ORDER_STATUS_UPDATE";
  public static final String ORDER_CANCEL_OWN = "ORDER_CANCEL_OWN";
  public static final String ORDER_REFUND_REQUEST = "ORDER_REFUND_REQUEST";
  public static final String ORDER_REFUND_APPROVE = "ORDER_REFUND_APPROVE";

  // ---- Commerce permissions ----
  public static final String CART_MANAGE = "CART_MANAGE";
  public static final String WISHLIST_MANAGE = "WISHLIST_MANAGE";
  public static final String FAVORITES_MANAGE = "FAVORITES_MANAGE";
  public static final String CHECKOUT = "CHECKOUT";
  public static final String COUPON_MANAGE_OWN = "COUPON_MANAGE_OWN";
  public static final String COUPON_MANAGE_ANY = "COUPON_MANAGE_ANY";

  // ---- Reviews ----
  public static final String REVIEW_CREATE = "REVIEW_CREATE";
  public static final String REVIEW_EDIT_OWN = "REVIEW_EDIT_OWN";
  public static final String REVIEW_DELETE_OWN = "REVIEW_DELETE_OWN";
  public static final String REVIEW_MODERATE = "REVIEW_MODERATE";

  // ---- User management ----
  public static final String USER_VIEW_ANY = "USER_VIEW_ANY";
  public static final String USER_STATUS_UPDATE = "USER_STATUS_UPDATE";
  public static final String USER_ROLE_UPDATE = "USER_ROLE_UPDATE";
  public static final String USER_PASSWORD_RESET_ANY = "USER_PASSWORD_RESET_ANY";
  public static final String SELLER_APPROVE = "SELLER_APPROVE";

  // ---- Analytics ----
  public static final String ANALYTICS_VIEW_OWN = "ANALYTICS_VIEW_OWN";
  public static final String ANALYTICS_VIEW_ANY = "ANALYTICS_VIEW_ANY";

  // ---- Audit / Settings ----
  public static final String AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW";
  public static final String SETTINGS_MANAGE = "SETTINGS_MANAGE";
}