package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a coupon code already exists. HTTP 409. */
public class DuplicateCouponCodeException extends ApiException {

  public DuplicateCouponCodeException(String code) {
    super(HttpStatus.CONFLICT, "DUPLICATE_COUPON_CODE",
        "Coupon code '" + code + "' already exists");
  }
}