package com.platform.ecommerce.auth;

import com.platform.ecommerce.auth.dto.AuthResponse;
import com.platform.ecommerce.auth.dto.ForgotPasswordRequest;
import com.platform.ecommerce.auth.dto.LoginRequest;
import com.platform.ecommerce.auth.dto.RegisterRequest;
import com.platform.ecommerce.auth.dto.ResetPasswordRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication endpoints. The refresh token is delivered as an
 * HttpOnly, Secure, SameSite=Strict cookie and is never accessible to
 * JavaScript. The refresh endpoint additionally requires the
 * {@code X-Requested-With: XMLHttpRequest} header as a CSRF mitigation
 * (Section 9.4) — cross-site form posts cannot set this header.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication")
public class AuthController {

  private static final String REFRESH_COOKIE = "refresh_token";

  private final AuthService authService;
  private final long refreshTokenTtlSeconds;

  public AuthController(
      AuthService authService,
      @Value("${app.jwt.refresh-token-ttl}") java.time.Duration refreshTokenTtl) {
    this.authService = authService;
    this.refreshTokenTtlSeconds = refreshTokenTtl.toSeconds();
  }

  @PostMapping("/register")
  @Operation(summary = "Register a new customer account",
      description = "Creates a CUSTOMER account, sends a simulated verification email, "
          + "and returns a full authenticated session (access token + refresh cookie).")
  public ResponseEntity<AuthResponse> register(
      @Valid @RequestBody RegisterRequest request,
      HttpServletResponse response) {
    AuthService.Session session = authService.register(request);
    setRefreshCookie(response, session.rawRefreshToken(), refreshTokenTtlSeconds);
    return ResponseEntity.ok(session.authResponse());
  }

  @PostMapping("/login")
  @Operation(summary = "Login",
      description = "Validates credentials and returns an access token (body) "
          + "plus a refresh token (HTTP-only cookie).")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request,
      HttpServletResponse response) {
    AuthService.Session session = authService.login(request);
    setRefreshCookie(response, session.rawRefreshToken(), refreshTokenTtlSeconds);
    return ResponseEntity.ok(session.authResponse());
  }

  @PostMapping("/refresh")
  @Operation(summary = "Refresh access token",
      description = "Rotates the refresh token cookie and returns a new access token. "
          + "Requires the X-Requested-With header (CSRF mitigation).")
  public ResponseEntity<AuthResponse> refresh(
      @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
      @RequestHeader(value = "X-Requested-With", required = false) String requestedWith,
      HttpServletResponse response) {
    if (refreshToken == null || refreshToken.isBlank()
        || !"XMLHttpRequest".equals(requestedWith)) {
      return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
    AuthService.Session session = authService.refresh(refreshToken);
    setRefreshCookie(response, session.rawRefreshToken(), refreshTokenTtlSeconds);
    return ResponseEntity.ok(session.authResponse());
  }

  @PostMapping("/logout")
  @Operation(summary = "Logout",
      description = "Revokes the refresh token server-side and blacklists the current "
          + "access token in Redis.")
  public ResponseEntity<Void> logout(
      @RequestHeader(value = "Authorization", required = false) String authorization,
      @CookieValue(name = REFRESH_COOKIE, required = false) String refreshToken,
      HttpServletResponse response) {
    String accessToken = null;
    if (authorization != null && authorization.startsWith("Bearer ")) {
      accessToken = authorization.substring(7);
    }
    authService.logout(accessToken, refreshToken);
    clearRefreshCookie(response);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/forgot-password")
  @Operation(summary = "Request password reset",
      description = "Always returns 200 to prevent user enumeration. If the email is "
          + "registered, a reset link is emailed (simulated console output in v1).")
  public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
    authService.forgotPassword(request);
    return ResponseEntity.ok().build();
  }

  @PostMapping("/reset-password")
  @Operation(summary = "Reset password with token")
  public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
    authService.resetPassword(request);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/verify-email")
  @Operation(summary = "Verify email address")
  public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
    authService.verifyEmail(token);
    return ResponseEntity.noContent().build();
  }

  private void setRefreshCookie(HttpServletResponse response, String rawToken, long ttlSeconds) {
    ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, rawToken)
        .httpOnly(true)
        .secure(true)
        .sameSite("Strict")
        .path("/api/v1/auth")
        .maxAge(ttlSeconds)
        .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }

  private void clearRefreshCookie(HttpServletResponse response) {
    ResponseCookie cookie = ResponseCookie.from(REFRESH_COOKIE, "")
        .httpOnly(true)
        .secure(true)
        .sameSite("Strict")
        .path("/api/v1/auth")
        .maxAge(0)
        .build();
    response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
  }
}