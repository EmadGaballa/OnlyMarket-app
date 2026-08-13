package com.platform.ecommerce.order.domain;

/**
 * Lifecycle status of an order. Only {@link #PREPARING} is used in v1 — an
 * order stays {@code PREPARING} until it is deleted. The enum is designed so
 * more statuses (e.g. SHIPPED, DELIVERED, CANCELLED) can be added later.
 */
public enum OrderStatus {
  PREPARING
}