package com.platform.ecommerce.auth;

import com.platform.ecommerce.auth.domain.RefreshToken;
import com.platform.ecommerce.common.exception.BadCredentialsException;
import com.platform.ecommerce.user.domain.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Opaque refresh-token lifecycle: issuance, rotation, and family
 * revocation (Section 9.1.3).
 *
 * <p>Only a SHA-256 hash of the raw token is persisted. Each rotation
 * invalidates the prior token; if a rotated (already-revoked) token is
 * ever presented again, the entire token family for that user is revoked
 * as a theft signal.</p>
 */
@Service
public class RefreshTokenService {

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final RefreshTokenRepository refreshTokenRepository;
  private final Duration refreshTokenTtl;

  public RefreshTokenService(
      RefreshTokenRepository refreshTokenRepository,
      @Value("${app.jwt.refresh-token-ttl}") Duration refreshTokenTtl) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.refreshTokenTtl = refreshTokenTtl;
  }

  /** Issue a new refresh token for the given user. */
  @Transactional
  public IssuedToken issueToken(User user) {
    String rawToken = generateRawToken();
    RefreshToken entity = new RefreshToken();
    entity.setUser(user);
    entity.setTokenHash(hash(rawToken));
    entity.setExpiresAt(Instant.now().plus(refreshTokenTtl));
    refreshTokenRepository.save(entity);
    return new IssuedToken(rawToken, entity);
  }

  /**
   * Rotate an existing refresh token. Validates the presented token,
   * revokes it, and issues its replacement. If the presented token was
   * already revoked/rotated, revokes the whole family and rejects.
   */
  @Transactional
  public RotationResult rotate(String rawToken) {
    RefreshToken presented = refreshTokenRepository.findByTokenHash(hash(rawToken))
        .orElseThrow(() -> new BadCredentialsException("Invalid refresh token"));

    if (presented.isRevoked()) {
      // Token reuse — theft signal. Revoke the entire family.
      revokeFamily(presented);
      throw new BadCredentialsException("Refresh token reuse detected; session family revoked");
    }

    if (presented.isExpired()) {
      presented.setRevokedAt(Instant.now());
      refreshTokenRepository.save(presented);
      throw new BadCredentialsException("Refresh token expired");
    }

    IssuedToken replacement = issueToken(presented.getUser());

    presented.setRevokedAt(Instant.now());
    presented.setReplacedByToken(replacement.entity());
    refreshTokenRepository.save(presented);

    return new RotationResult(replacement.rawToken(), presented.getUser());
  }

  /** Revoke all unexpired refresh tokens for the given user. */
  @Transactional
  public void revokeAllForUser(Long userId) {
    List<RefreshToken> active = refreshTokenRepository.findAllByUserIdAndRevokedAtIsNull(userId);
    Instant now = Instant.now();
    active.forEach(t -> t.setRevokedAt(now));
    refreshTokenRepository.saveAll(active);
  }

  /** Revoke a single refresh token (used on explicit logout). */
  @Transactional
  public void revoke(String rawToken) {
    refreshTokenRepository.findByTokenHash(hash(rawToken)).ifPresent(token -> {
      token.setRevokedAt(Instant.now());
      refreshTokenRepository.save(token);
    });
  }

  private void revokeFamily(RefreshToken seed) {
    List<RefreshToken> active = refreshTokenRepository
        .findAllByUserIdAndRevokedAtIsNull(seed.getUser().getId());
    active.forEach(t -> t.setRevokedAt(Instant.now()));
    refreshTokenRepository.saveAll(active);
  }

  private String generateRawToken() {
    byte[] bytes = new byte[48];
    SECURE_RANDOM.nextBytes(bytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }

  static String hash(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return Base64.getUrlEncoder().withoutPadding().encodeToString(hashed);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 unavailable", e);
    }
  }

  /** A freshly issued raw token together with its persisted entity. */
  public record IssuedToken(String rawToken, RefreshToken entity) {}

  /** Result of a successful rotation — carries the new raw token and the user. */
  public record RotationResult(String rawToken, User user) {}
}