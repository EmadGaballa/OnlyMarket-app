package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when login credentials are invalid. HTTP 401. */
public class BadCredentialsException extends ApiException {

  public BadCredentialsException(String message) {
    super(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", message);
  }
}