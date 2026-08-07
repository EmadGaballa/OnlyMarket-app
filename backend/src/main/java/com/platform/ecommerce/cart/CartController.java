package com.platform.ecommerce.cart;

import com.platform.ecommerce.cart.domain.CartItem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Cart endpoints. All operations are scoped to the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/cart")
@Tag(name = "Cart")
public class CartController {

  private final CartService cartService;

  public CartController(CartService cartService) {
    this.cartService = cartService;
  }

  @GetMapping
  @Operation(summary = "Get current user's cart items")
  public ResponseEntity<List<CartItem>> getCart(Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(cartService.listItems(userId));
  }

  @PostMapping("/items")
  @Operation(summary = "Add item to cart")
  public ResponseEntity<CartItem> addItem(
      Authentication authentication,
      @RequestParam Long productVariantId,
      @RequestParam(defaultValue = "1") int quantity) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(cartService.addItem(userId, productVariantId, quantity));
  }

  @PutMapping("/items/{cartItemId}")
  @Operation(summary = "Update cart item quantity")
  public ResponseEntity<CartItem> updateItem(
      Authentication authentication,
      @PathVariable Long cartItemId,
      @RequestParam int quantity) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(cartService.updateQuantity(userId, cartItemId, quantity));
  }

  @DeleteMapping("/items/{cartItemId}")
  @Operation(summary = "Remove item from cart")
  public ResponseEntity<Void> removeItem(
      Authentication authentication,
      @PathVariable Long cartItemId) {
    Long userId = currentUserId(authentication);
    cartService.removeItem(userId, cartItemId);
    return ResponseEntity.noContent().build();
  }

  @DeleteMapping
  @Operation(summary = "Clear cart")
  public ResponseEntity<Void> clearCart(Authentication authentication) {
    Long userId = currentUserId(authentication);
    cartService.clear(userId);
    return ResponseEntity.noContent().build();
  }

  private Long currentUserId(Authentication authentication) {
    var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
    return cartService.resolveUserIdByEmail(principal.getUsername());
  }
}