package com.platform.ecommerce.wishlist;

import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.catalog.product.ProductRepository;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import com.platform.ecommerce.wishlist.domain.Wishlist;
import com.platform.ecommerce.wishlist.domain.WishlistItem;
import com.platform.ecommerce.wishlist.dto.WishlistItemResponse;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Wishlist operations scoped to the authenticated user. */
@Service
public class WishlistService {

  private final WishlistRepository wishlistRepository;
  private final WishlistItemRepository wishlistItemRepository;
  private final UserRepository userRepository;
  private final ProductRepository productRepository;

  public WishlistService(
      WishlistRepository wishlistRepository,
      WishlistItemRepository wishlistItemRepository,
      UserRepository userRepository,
      ProductRepository productRepository) {
    this.wishlistRepository = wishlistRepository;
    this.wishlistItemRepository = wishlistItemRepository;
    this.userRepository = userRepository;
    this.productRepository = productRepository;
  }

  @Transactional
  public Wishlist getOrCreateWishlist(Long userId) {
    return wishlistRepository
        .findByUserId(userId)
        .orElseGet(() -> {
          User user = userRepository
              .findById(userId)
              .orElseThrow(
                  () -> new ResourceNotFoundException(
                      "User", userId));

          Wishlist wishlist = new Wishlist();
          wishlist.setUser(user);

          return wishlistRepository.save(wishlist);
        });
  }

  @Transactional
  public WishlistItemResponse addItem(Long userId, Long productId) {
    Wishlist wishlist = getOrCreateWishlist(userId);

    Product product = productRepository
        .findById(productId)
        .orElseThrow(
            () -> new ResourceNotFoundException(
                "Product", productId));

    WishlistItem item = wishlistItemRepository
        .findByWishlistIdAndProductId(wishlist.getId(), productId)
        .orElseGet(
            () -> {
              WishlistItem newItem = new WishlistItem();
              newItem.setWishlist(wishlist);
              newItem.setProduct(product);

              return wishlistItemRepository.save(newItem);
            });

    return toResponse(item);
  }

  @Transactional
  public void removeItem(Long userId, Long productId) {
    Wishlist wishlist = getOrCreateWishlist(userId);

    wishlistItemRepository.deleteByWishlistIdAndProductId(
        wishlist.getId(),
        productId);
  }

  @Transactional
  public List<WishlistItemResponse> listItems(Long userId) {
    Wishlist wishlist = getOrCreateWishlist(userId);
    return wishlistItemRepository.findByWishlistIdWithDetails(wishlist.getId())
        .stream()
        .map(this::toResponse)
        .toList();
  }

  private WishlistItemResponse toResponse(WishlistItem item) {
    var product = item.getProduct();
    String imageUrl = product.getImages() != null && !product.getImages().isEmpty()
        ? product.getImages().iterator().next().getUrl()
        : null;
    return new WishlistItemResponse(
        item.getId(),
        product.getId(),
        product.getName(),
        product.getSlug(),
        imageUrl,
        product.getBasePrice());
  }

  @Transactional(readOnly = true)
  public Long resolveUserIdByEmail(String email) {
    return userRepository
        .findByEmail(email)
        .orElseThrow(
            () -> new ResourceNotFoundException(
                "User with email " + email))
        .getId();
  }
}