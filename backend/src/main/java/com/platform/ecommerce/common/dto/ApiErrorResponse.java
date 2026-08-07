package com.platform.ecommerce.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Consistent error envelope returned by the global exception handler.
 *
 * @param timestamp when the error occurred
 * @param status HTTP status code
 * @param error HTTP status reason phrase
 * @param message human-readable error message
 * @param path request path that produced the error
 * @param fieldErrors map of field name to validation message (optional)
 * @param correlationId server-side correlation id for log lookup
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    String path,
    Map<String, String> fieldErrors,
    String correlationId) {

  public static Builder builder() {
    return new Builder();
  }

  public static final class Builder {
    private Instant timestamp = Instant.now();
    private int status;
    private String error;
    private String message;
    private String path;
    private Map<String, String> fieldErrors;
    private String correlationId;

    public Builder timestamp(Instant timestamp) {
      this.timestamp = timestamp;
      return this;
    }

    public Builder status(int status) {
      this.status = status;
      return this;
    }

    public Builder error(String error) {
      this.error = error;
      return this;
    }

    public Builder message(String message) {
      this.message = message;
      return this;
    }

    public Builder path(String path) {
      this.path = path;
      return this;
    }

    public Builder fieldErrors(Map<String, String> fieldErrors) {
      this.fieldErrors = fieldErrors;
      return this;
    }

    public Builder correlationId(String correlationId) {
      this.correlationId = correlationId;
      return this;
    }

    public ApiErrorResponse build() {
      return new ApiErrorResponse(timestamp, status, error, message, path, fieldErrors, correlationId);
    }
  }
}