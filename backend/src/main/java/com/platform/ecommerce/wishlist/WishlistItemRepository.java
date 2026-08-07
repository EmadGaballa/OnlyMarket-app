package com.platform.ecommerce.wishlist;

import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.wishlist.domain.Wishlist;
import com.platform.ecommerce.wishlist.domain.WishlistItem;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link WishlistItem}. */
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

  List<WishlistItem> findByWishlistId(Long wishlistId);

  Optional<WishlistItem> findByWishlistIdAndProductId(Long wishlistId, Long productId);

  void deleteByWishlistIdAndProductId(Long wishlistId, Long productId);

  void deleteByWishlistId(Long wishlistId);
}