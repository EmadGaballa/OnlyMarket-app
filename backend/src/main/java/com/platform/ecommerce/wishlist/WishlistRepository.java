package com.platform.ecommerce.wishlist;

import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.wishlist.domain.Wishlist;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Wishlist}. */
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

  Optional<Wishlist> findByUser(User user);

  Optional<Wishlist> findByUserId(Long userId);
}