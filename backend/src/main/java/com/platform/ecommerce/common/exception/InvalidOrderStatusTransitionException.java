package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when an order status transition is not allowed by the state machine. HTTP 409. */
public class InvalidOrderStatusTransitionException extends ApiException {

  public InvalidOrderStatusTransitionException(String orderNumber, String from, String to) {
    super(HttpStatus.CONFLICT, "INVALID_ORDER_STATUS_TRANSITION",
        "Cannot transition order " + orderNumber + " from " + from + " to " + to);
  }
}