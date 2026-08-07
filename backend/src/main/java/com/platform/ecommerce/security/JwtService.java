package com.platform.ecommerce.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Creates and validates JWT access tokens.
 *
 * <p>Each token carries a {@code jti} claim (unique token id) so it can be
 * blacklisted in Redis on logout before natural expiry. The HS256 secret
 * must be at least 256 bits in production (enforced at startup).</p>
 */
@Service
public class JwtService {

  private final SecretKey signingKey;
  private final Duration accessTokenTtl;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.access-token-ttl}") Duration accessTokenTtl) {
    this.signingKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(
        padBase64(secret)));
    this.accessTokenTtl = accessTokenTtl;
  }

  public record AccessToken(String token, String jti, Instant expiresAt) {}

  public AccessToken generateAccessToken(Long userId, String email) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(accessTokenTtl);
    String jti = UUID.randomUUID().toString();

    String token = Jwts.builder()
        .subject(email)
        .claim("uid", userId)
        .id(jti)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(signingKey)
        .compact();

    return new AccessToken(token, jti, expiresAt);
  }

  public Claims parseToken(String token) {
    return Jwts.parser()
        .verifyWith(signingKey)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }

  public boolean isValid(String token) {
    try {
      parseToken(token);
      return true;
    } catch (Exception e) {
      return false;
    }
  }

  public String extractJti(String token) {
    return parseToken(token).getId();
  }

  public Instant extractExpiration(String token) {
    return parseToken(token).getExpiration().toInstant();
  }

  public Long extractUserId(String token) {
    return parseToken(token).get("uid", Long.class);
  }

  /**
   * JWT secret is configured as a plain string in dev; jjwt requires
   * base64. This pads the string so dev secrets can be simple passphrases.
   */
  private static String padBase64(String secret) {
    if (secret.matches("^[A-Za-z0-9+/=]+$") && secret.length() % 4 == 0) {
      return secret;
    }
    return java.util.Base64.getEncoder().encodeToString(secret.getBytes());
  }
}