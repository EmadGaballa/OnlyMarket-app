package com.platform.ecommerce.auth;

import com.platform.ecommerce.auth.domain.RefreshToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link RefreshToken}. */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

  Optional<RefreshToken> findByTokenHash(String tokenHash);

  List<RefreshToken> findAllByUserIdAndRevokedAtIsNull(Long userId);

  void deleteByUserId(Long userId);
}