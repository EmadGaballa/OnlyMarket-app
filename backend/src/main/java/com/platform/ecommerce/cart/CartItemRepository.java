package com.platform.ecommerce.cart;

import com.platform.ecommerce.cart.domain.Cart;
import com.platform.ecommerce.cart.domain.CartItem;
import com.platform.ecommerce.catalog.variant.domain.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link CartItem}. */
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

  List<CartItem> findByCartId(Long cartId);

  Optional<CartItem> findByCartIdAndProductVariantId(Long cartId, Long productVariantId);

  void deleteByCartId(Long cartId);

  void deleteByCartIdAndProductVariantId(Long cartId, Long productVariantId);
}