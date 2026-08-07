package com.platform.ecommerce.favorite;

import com.platform.ecommerce.favorite.domain.Favorite;
import com.platform.ecommerce.user.domain.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Favorite}. */
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

  List<Favorite> findByUserId(Long userId);

  Optional<Favorite> findByUserIdAndProductId(Long userId, Long productId);

  void deleteByUserIdAndProductId(Long userId, Long productId);

  boolean existsByUserIdAndProductId(Long userId, Long productId);
}