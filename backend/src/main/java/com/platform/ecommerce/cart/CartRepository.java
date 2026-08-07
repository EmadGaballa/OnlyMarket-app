package com.platform.ecommerce.cart;

import com.platform.ecommerce.cart.domain.Cart;
import com.platform.ecommerce.user.domain.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Cart}. */
public interface CartRepository extends JpaRepository<Cart, Long> {

  Optional<Cart> findByUser(User user);

  Optional<Cart> findByUserId(Long userId);
}