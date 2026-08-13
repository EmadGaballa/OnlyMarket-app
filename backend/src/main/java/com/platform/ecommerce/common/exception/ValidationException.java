package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown for a semantically invalid request that is not captured by bean
 * validation — e.g. a password-policy violation raised inside a service.
 * HTTP 400, rendered under the standard {@code VALIDATION_ERROR} code.
 */
public class ValidationException extends ApiException {

  public ValidationException(String message) {
    super(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
  }
}