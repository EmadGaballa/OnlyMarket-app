package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when checkout cannot reserve the requested quantity.
 * HTTP 409 Conflict — the entire checkout transaction rolls back.
 */
public class InsufficientStockException extends ApiException {

  private final String sku;
  private final int requested;
  private final int available;

  public InsufficientStockException(String sku, int requested, int available) {
    super(HttpStatus.CONFLICT, "INSUFFICIENT_STOCK",
        "Insufficient stock for SKU '" + sku + "': requested " + requested
            + ", available " + available);
    this.sku = sku;
    this.requested = requested;
    this.available = available;
  }

  public String getSku() {
    return sku;
  }

  public int getRequested() {
    return requested;
  }

  public int getAvailable() {
    return available;
  }
}