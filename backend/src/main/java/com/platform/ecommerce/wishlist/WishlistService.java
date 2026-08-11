package com.platform.ecommerce.wishlist;

import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.wishlist.domain.Wishlist;
import com.platform.ecommerce.wishlist.domain.WishlistItem;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Wishlist operations scoped to the authenticated user. */
@Service
public class WishlistService {

  private final WishlistRepository wishlistRepository;
  private final WishlistItemRepository wishlistItemRepository;
  private final UserRepository userRepository;

  public WishlistService(
      WishlistRepository wishlistRepository,
      WishlistItemRepository wishlistItemRepository,
      UserRepository userRepository) {
    this.wishlistRepository = wishlistRepository;
    this.wishlistItemRepository = wishlistItemRepository;
    this.userRepository = userRepository;
  }

  // FIX: Removed readOnly = true because save() inserts a new wishlist if missing
  @Transactional
  public Wishlist getOrCreateWishlist(Long userId) {
    return wishlistRepository
        .findByUserId(userId)
        .orElseGet(
            () -> {
              User user =
                  userRepository
                      .findById(userId)
                      .orElseThrow(() -> new ResourceNotFoundException("User", userId));
              Wishlist wishlist = new Wishlist();
              wishlist.setUser(user);
              return wishlistRepository.save(wishlist);
            });
  }

  @Transactional
  public WishlistItem addItem(Long userId, Long productId) {
    Wishlist wishlist = getOrCreateWishlist(userId);
    Product product = new Product();
    product.setId(productId);

    return wishlistItemRepository
        .findByWishlistIdAndProductId(wishlist.getId(), productId)
        .orElseGet(
            () -> {
              WishlistItem item = new WishlistItem();
              item.setWishlist(wishlist);
              item.setProduct(product);
              return wishlistItemRepository.save(item);
            });
  }

  @Transactional
  public void removeItem(Long userId, Long productId) {
    Wishlist wishlist = getOrCreateWishlist(userId);
    wishlistItemRepository
        .findByWishlistIdAndProductId(wishlist.getId(), productId)
        .ifPresent(wishlistItemRepository::delete);
  }

  // FIX: Removed readOnly = true because listItems calls getOrCreateWishlist()
  @Transactional
  public List<WishlistItem> listItems(Long userId) {
    Wishlist wishlist = getOrCreateWishlist(userId);
    return wishlistItemRepository.findByWishlistId(wishlist.getId());
  }

  @Transactional(readOnly = true)
  public Long resolveUserIdByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email))
        .getId();
  }
}