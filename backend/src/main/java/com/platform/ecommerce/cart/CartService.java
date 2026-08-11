package com.platform.ecommerce.cart;

import com.platform.ecommerce.catalog.variant.ProductVariantRepository;
import com.platform.ecommerce.cart.domain.Cart;
import com.platform.ecommerce.cart.domain.CartItem;
import com.platform.ecommerce.catalog.variant.domain.ProductVariant;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Cart operations scoped to the authenticated user. */
@Service
public class CartService {

  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final UserRepository userRepository;

  private final ProductVariantRepository productVariantRepository;

  public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
      UserRepository userRepository, ProductVariantRepository productVariantRepository) {
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
    this.userRepository = userRepository;
    this.productVariantRepository = productVariantRepository;
  }

  // FIX 1: Removed readOnly = true because save() may be called when creating a
  // cart
  @Transactional
  public Cart getOrCreateCart(Long userId) {
    return cartRepository.findByUserId(userId)
        .orElseGet(() -> {
          User user = userRepository.findById(userId)
              .orElseThrow(() -> new ResourceNotFoundException("User", userId));
          Cart cart = new Cart();
          cart.setUser(user);
          return cartRepository.save(cart);
        });
  }

  @Transactional(readOnly = true)
  public Long resolveUserIdByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new ResourceNotFoundException("User with email " + email))
        .getId();
  }

  @Transactional
  public CartItem addItem(Long userId, Long productVariantId, int quantity) {
    Cart cart = getOrCreateCart(userId);
    ProductVariant variant = productVariantRepository.findById(productVariantId)
        .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", productVariantId));

    return cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), productVariantId)
        .map(existing -> {
          existing.setQuantity(existing.getQuantity() + quantity);
          return cartItemRepository.save(existing);
        })
        .orElseGet(() -> {
          CartItem item = new CartItem();
          item.setCart(cart);
          item.setProductVariant(variant);
          item.setQuantity(quantity);
          return cartItemRepository.save(item);
        });
  }

  @Transactional
  public CartItem updateQuantity(Long userId, Long cartItemId, int quantity) {
    Cart cart = getOrCreateCart(userId);
    CartItem item = cartItemRepository.findById(cartItemId)
        .orElseThrow(() -> new ResourceNotFoundException("CartItem", cartItemId));
    if (!item.getCart().getId().equals(cart.getId())) {
      throw new ResourceNotFoundException("CartItem", cartItemId);
    }
    item.setQuantity(quantity);
    return cartItemRepository.save(item);
  }

  @Transactional
  public void removeItem(Long userId, Long cartItemId) {
    Cart cart = getOrCreateCart(userId);
    CartItem item = cartItemRepository.findById(cartItemId)
        .orElseThrow(() -> new ResourceNotFoundException("CartItem", cartItemId));
    if (!item.getCart().getId().equals(cart.getId())) {
      throw new ResourceNotFoundException("CartItem", cartItemId);
    }
    cartItemRepository.delete(item);
  }

  // FIX 2: Removed readOnly = true because listItems calls getOrCreateCart(),
  // which can execute an INSERT query.
  @Transactional
  public List<CartItem> listItems(Long userId) {
    Cart cart = getOrCreateCart(userId);
    return cartItemRepository.findByCartId(cart.getId());
  }

  @Transactional
  public void clear(Long userId) {
    Cart cart = getOrCreateCart(userId);
    cartItemRepository.deleteByCartId(cart.getId());
  }
}