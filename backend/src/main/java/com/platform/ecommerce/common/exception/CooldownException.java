package com.platform.ecommerce.common.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when an account-change cooldown is active (e.g. password can only be
 * changed once per 24h, name/email once per 30 days). HTTP 409.
 */
public class CooldownException extends ApiException {

  public CooldownException(String message) {
    super(HttpStatus.CONFLICT, "COOLDOWN_ACTIVE", message);
  }
}