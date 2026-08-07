package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/** Thrown when a requested resource does not exist. HTTP 404. */
public class ResourceNotFoundException extends ApiException {

  public ResourceNotFoundException(String resource, Object id) {
    super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND",
        resource + " not found with id: " + id);
  }

  public ResourceNotFoundException(String message) {
    super(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", message);
  }
}