package com.platform.ecommerce.auth.domain;

import com.platform.ecommerce.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Server-side record of a refresh token.
 *
 * <p>Stores only a SHA-256 hash of the raw token — never the raw token.
 * Supports rotation ({@code replacedByTokenId}) and family revocation:
 * when a rotated token is reused, the whole family is revoked (Section
 * 9.1.3).</p>
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
public class RefreshToken {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(name = "token_hash", nullable = false, unique = true, length = 255)
  private String tokenHash;

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "revoked_at")
  private Instant revokedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "replaced_by_token_id")
  private RefreshToken replacedByToken;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public boolean isExpired() {
    return expiresAt.isBefore(Instant.now());
  }

  public boolean isRevoked() {
    return revokedAt != null;
  }
}