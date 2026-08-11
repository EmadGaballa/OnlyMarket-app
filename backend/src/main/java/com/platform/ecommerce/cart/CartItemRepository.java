package com.platform.ecommerce.cart;

import com.platform.ecommerce.cart.domain.CartItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Data access for {@link CartItem}. */
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

  List<CartItem> findByCartId(Long cartId);

  Optional<CartItem> findByCartIdAndProductVariantId(Long cartId, Long productVariantId);

  void deleteByCartId(Long cartId);

  void deleteByCartIdAndProductVariantId(Long cartId, Long productVariantId);

  /**
   * Eagerly loads everything needed to build a {@code CartItemResponse} in a
   * single query: variant, its product and the product's images.
   */
  @Query("""
        SELECT DISTINCT ci FROM CartItem ci
        JOIN FETCH ci.productVariant pv
        JOIN FETCH pv.product p
        LEFT JOIN FETCH p.images
        WHERE ci.cart.id = :cartId
      """)
  List<CartItem> findByCartIdWithDetails(@Param("cartId") Long cartId);

  /** Same eager fetch as above but limited to a single line item in a cart. */
  @Query("""
        SELECT DISTINCT ci FROM CartItem ci
        JOIN FETCH ci.productVariant pv
        JOIN FETCH pv.product p
        LEFT JOIN FETCH p.images
        WHERE ci.id = :id AND ci.cart.id = :cartId
      """)
  Optional<CartItem> findByIdAndCartIdWithDetails(@Param("id") Long id, @Param("cartId") Long cartId);
}