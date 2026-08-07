package com.platform.ecommerce.common.exception;

import com.platform.ecommerce.common.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

/**
 * Global exception handler mapping every exception to the consistent
 * {@link ApiErrorResponse} envelope. In the production profile, internal
 * exception messages are suppressed in favor of a correlation id for log
 * lookup; full detail is exposed in the {@code dev} profile.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
  private static final boolean DEV_PROFILE =
      System.getProperty("spring.profiles.active", "dev").equalsIgnoreCase("dev");

  @ExceptionHandler(ApiException.class)
  public ResponseEntity<ApiErrorResponse> handleApiException(
      ApiException ex, HttpServletRequest request) {
    return buildResponse(ex.getStatus(), ex.getErrorCode(), ex.getMessage(), request, null);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ApiErrorResponse> handleValidation(
      MethodArgumentNotValidException ex, HttpServletRequest request) {
    Map<String, String> fieldErrors = new HashMap<>();
    for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
      fieldErrors.put(fe.getField(), fe.getDefaultMessage());
    }
    return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
        "Request validation failed", request, fieldErrors);
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
      ConstraintViolationException ex, HttpServletRequest request) {
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getConstraintViolations().forEach(
        cv -> fieldErrors.put(cv.getPropertyPath().toString(), cv.getMessage()));
    return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
        "Request validation failed", request, fieldErrors);
  }

  @ExceptionHandler(HandlerMethodValidationException.class)
  public ResponseEntity<ApiErrorResponse> handleMethodValidation(
      HandlerMethodValidationException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
        "Request validation failed", request, null);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ApiErrorResponse> handleUnreadable(
      HttpMessageNotReadableException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.BAD_REQUEST, "MALFORMED_REQUEST",
        "Malformed JSON request body", request, null);
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ApiErrorResponse> handleMissingParam(
      MissingServletRequestParameterException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.BAD_REQUEST, "MISSING_PARAMETER",
        "Missing required parameter: " + ex.getParameterName(), request, null);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ApiErrorResponse> handleAccessDenied(
      AccessDeniedException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.FORBIDDEN, "ACCESS_DENIED",
        "You do not have permission to perform this action", request, null);
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ApiErrorResponse> handleAuthentication(
      AuthenticationException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED",
        "Authentication required", request, null);
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  public ResponseEntity<ApiErrorResponse> handleUploadSize(
      MaxUploadSizeExceededException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.PAYLOAD_TOO_LARGE, "FILE_TOO_LARGE",
        "Uploaded file exceeds the maximum allowed size", request, null);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ApiErrorResponse> handleGeneric(
      Exception ex, HttpServletRequest request) {
    String correlationId = UUID.randomUUID().toString();
    log.error("Unhandled exception [{}] at {}: {}", correlationId, request.getRequestURI(),
        ex.getMessage(), ex);
    String message = DEV_PROFILE
        ? (ex.getMessage() == null ? "Internal server error" : ex.getMessage())
        : "An unexpected error occurred. Reference: " + correlationId;
    return buildResponse(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_ERROR",
        message, request, null, correlationId);
  }

  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<ApiErrorResponse> handleNotFound(
      NoHandlerFoundException ex, HttpServletRequest request) {
    return buildResponse(HttpStatus.NOT_FOUND, "NOT_FOUND",
        "No handler found for " + ex.getHttpMethod() + " " + ex.getRequestURL(),
        request, null);
  }

  private ResponseEntity<ApiErrorResponse> buildResponse(
      HttpStatus status, String errorCode, String message,
      HttpServletRequest request, Map<String, String> fieldErrors) {
    return buildResponse(status, errorCode, message, request, fieldErrors, null);
  }

  private ResponseEntity<ApiErrorResponse> buildResponse(
      HttpStatus status, String errorCode, String message,
      HttpServletRequest request, Map<String, String> fieldErrors, String correlationId) {
    ApiErrorResponse body = ApiErrorResponse.builder()
        .timestamp(Instant.now())
        .status(status.value())
        .error(errorCode)
        .message(message)
        .path(request.getRequestURI())
        .fieldErrors(fieldErrors)
        .correlationId(correlationId)
        .build();
    return ResponseEntity.status(status).body(body);
  }
}