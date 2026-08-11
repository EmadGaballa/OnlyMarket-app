package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a cart add/update requests more of a variant than is available.
 * HTTP 400 Bad Request — the caller surfaces the friendly message to the user.
 */
public class StockLimitExceededException extends ApiException {

  private final int available;

  public StockLimitExceededException(int available) {
    super(HttpStatus.BAD_REQUEST, "STOCK_LIMIT_EXCEEDED", "Only " + available + " left in stock");
    this.available = available;
  }

  public int getAvailable() {
    return available;
  }
}