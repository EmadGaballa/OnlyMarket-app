package com.platform.ecommerce.cart;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.platform.ecommerce.cart.domain.Cart;
import com.platform.ecommerce.cart.domain.CartItem;
import com.platform.ecommerce.cart.dto.CartItemResponse;
import com.platform.ecommerce.cart.dto.CartResponse;
import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.catalog.variant.ProductVariantRepository;
import com.platform.ecommerce.catalog.variant.domain.ProductVariant;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import com.platform.ecommerce.common.exception.StockLimitExceededException;
import com.platform.ecommerce.user.UserRepository;
import com.platform.ecommerce.user.domain.User;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Cart operations scoped to the authenticated user.
 *
 * <p>
 * All read paths map entities to {@link CartItemResponse}/{@link CartResponse}
 * DTOs inside the transaction, backed by the eagerly fetch-joined repository
 * queries. No JPA entity ever crosses the wire.
 */
@Service
public class CartService {

  private final CartRepository cartRepository;
  private final CartItemRepository cartItemRepository;
  private final UserRepository userRepository;
  private final ProductVariantRepository productVariantRepository;
  private final ObjectMapper objectMapper;

  public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
      UserRepository userRepository, ProductVariantRepository productVariantRepository,
      ObjectMapper objectMapper) {
    this.cartRepository = cartRepository;
    this.cartItemRepository = cartItemRepository;
    this.userRepository = userRepository;
    this.productVariantRepository = productVariantRepository;
    this.objectMapper = objectMapper;
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
  public CartItemResponse addItem(Long userId, Long productVariantId, int quantity) {
    Cart cart = getOrCreateCart(userId);
    ProductVariant variant = productVariantRepository.findById(productVariantId)
        .orElseThrow(() -> new ResourceNotFoundException("ProductVariant", productVariantId));

    CartItem item = cartItemRepository.findByCartIdAndProductVariantId(cart.getId(), productVariantId)
        .map(existing -> {
          int nextQuantity = existing.getQuantity() + quantity;
          validateStock(variant, nextQuantity);
          existing.setQuantity(nextQuantity);
          return cartItemRepository.save(existing);
        })
        .orElseGet(() -> {
          validateStock(variant, quantity);
          CartItem newItem = new CartItem();
          newItem.setCart(cart);
          newItem.setProductVariant(variant);
          newItem.setQuantity(quantity);
          return cartItemRepository.save(newItem);
        });

    return toResponse(fetchItem(cart.getId(), item.getId()));
  }

  @Transactional
  public CartItemResponse updateQuantity(Long userId, Long cartItemId, int quantity) {
    Cart cart = getOrCreateCart(userId);
    CartItem item = fetchItem(cart.getId(), cartItemId);
    validateStock(item.getProductVariant(), quantity);
    item.setQuantity(quantity);
    cartItemRepository.save(item);
    return toResponse(item);
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
  public CartResponse listItems(Long userId) {
    Cart cart = getOrCreateCart(userId);
    List<CartItemResponse> items = cartItemRepository.findByCartIdWithDetails(cart.getId())
        .stream()
        .map(this::toResponse)
        .toList();
    return new CartResponse(items, subtotal(items), itemCount(items));
  }

  @Transactional
  public void clear(Long userId) {
    Cart cart = getOrCreateCart(userId);
    cartItemRepository.deleteByCartId(cart.getId());
  }

  /* ------------------------------------------------------------------------ */
  /* Mapping & helpers */
  /* ------------------------------------------------------------------------ */

  private CartItem fetchItem(Long cartId, Long cartItemId) {
    return cartItemRepository.findByIdAndCartIdWithDetails(cartItemId, cartId)
        .orElseThrow(() -> new ResourceNotFoundException("CartItem", cartItemId));
  }

  /** Rejects any quantity request beyond the variant's available stock. */
  private void validateStock(ProductVariant variant, int quantity) {
    Integer stock = variant.getStockQuantity();
    if (stock != null && quantity > stock) {
      throw new StockLimitExceededException(stock);
    }
  }

  private CartItemResponse toResponse(CartItem item) {
    ProductVariant variant = item.getProductVariant();
    Product product = variant.getProduct();
    BigDecimal unitPrice = variant.effectivePrice();
    Integer stock = variant.getStockQuantity();

    String imageUrl = product.getImages() != null && !product.getImages().isEmpty()
        ? product.getImages().iterator().next().getUrl()
        : null;

    return new CartItemResponse(
        item.getId(),
        variant.getId(),
        product.getId(),
        product.getName(),
        product.getSlug(),
        variantName(variant),
        variant.getSku(),
        imageUrl,
        unitPrice,
        item.getQuantity(),
        unitPrice.multiply(BigDecimal.valueOf(item.getQuantity())),
        stock == null || stock > 0,
        stock != null ? stock : Integer.MAX_VALUE);
  }

  /**
   * Renders the variant's JSON attributes into a human label, e.g. "Blue /
   * Large".
   */
  private String variantName(ProductVariant variant) {
    String raw = variant.getAttributesJson();
    if (raw == null || raw.isBlank()) {
      return null;
    }
    try {
      Map<String, Object> attributes = objectMapper.readValue(
          raw, new TypeReference<LinkedHashMap<String, Object>>() {
          });
      if (attributes.isEmpty()) {
        return null;
      }
      return String.join(" / ", attributes.values().stream()
          .map(String::valueOf)
          .map(String::trim)
          .filter(v -> !v.isEmpty())
          .toList());
    } catch (Exception e) {
      return null;
    }
  }

  private BigDecimal subtotal(List<CartItemResponse> items) {
    return items.stream()
        .map(CartItemResponse::lineTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
  }

  private int itemCount(List<CartItemResponse> items) {
    return items.stream().mapToInt(CartItemResponse::quantity).sum();
  }
}