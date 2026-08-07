package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for all application-level exceptions.
 * Carries an HTTP status so the global exception handler can map it
 * without per-type switch logic.
 */
public abstract class ApiException extends RuntimeException {

  private final HttpStatus status;
  private final String errorCode;

  protected ApiException(HttpStatus status, String errorCode, String message) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }

  protected ApiException(HttpStatus status, String errorCode, String message, Throwable cause) {
    super(message, cause);
    this.status = status;
    this.errorCode = errorCode;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public String getErrorCode() {
    return errorCode;
  }
}