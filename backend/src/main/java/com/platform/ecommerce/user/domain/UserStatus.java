package com.platform.ecommerce.user.domain;

/** Lifecycle status of a user account. */
public enum UserStatus {
  ACTIVE,
  SUSPENDED,
  BANNED,
  /** Soft-deleted account; kept for order-history integrity. */
  DELETED
}