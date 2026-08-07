package com.platform.ecommerce.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

/**
 * Authenticated session response. The access token is returned in the
 * body (held in memory by the SPA); the refresh token is set as an
 * HTTP-only cookie.
 *
 * @param accessToken short-lived JWT
 * @param tokenType always "Bearer"
 * @param expiresInSeconds access token TTL in seconds
 * @param user authenticated user summary
 */
public record AuthResponse(
    @Schema(description = "Short-lived JWT access token (15 min)")
    String accessToken,

    @Schema(description = "Token type", example = "Bearer")
    String tokenType,

    @Schema(description = "Access token lifetime in seconds", example = "900")
    long expiresInSeconds,

    @Schema(description = "Authenticated user summary")
    UserSummary user) {

  public record UserSummary(
      Long id,
      String email,
      String firstName,
      String lastName,
      List<String> roles,
      List<String> permissions) {}
}