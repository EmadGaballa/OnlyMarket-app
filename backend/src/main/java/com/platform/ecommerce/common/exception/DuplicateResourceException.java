package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a uniqueness constraint is violated (e.g. duplicate email, SKU, slug). HTTP 409. */
public class DuplicateResourceException extends ApiException {

  public DuplicateResourceException(String message) {
    super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE", message);
  }

  public DuplicateResourceException(String resource, String field, String value) {
    super(HttpStatus.CONFLICT, "DUPLICATE_RESOURCE",
        resource + " with " + field + " '" + value + "' already exists");
  }
}