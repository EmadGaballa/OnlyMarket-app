package com.platform.ecommerce.wishlist;

import com.platform.ecommerce.wishlist.domain.WishlistItem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Wishlist endpoints. All operations are scoped to the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/wishlist")
@Tag(name = "Wishlist")
public class WishlistController {

  private final WishlistService wishlistService;

  public WishlistController(WishlistService wishlistService) {
    this.wishlistService = wishlistService;
  }

  @GetMapping
  @Operation(summary = "Get current user's wishlist items")
  public ResponseEntity<List<WishlistItem>> getWishlist(Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(wishlistService.listItems(userId));
  }

  @PostMapping("/items")
  @Operation(summary = "Add product to wishlist")
  public ResponseEntity<WishlistItem> addItem(
      Authentication authentication,
      @RequestParam Long productId) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(wishlistService.addItem(userId, productId));
  }

  @DeleteMapping("/items/{productId}")
  @Operation(summary = "Remove product from wishlist")
  public ResponseEntity<Void> removeItem(
      Authentication authentication,
      @PathVariable Long productId) {
    Long userId = currentUserId(authentication);
    wishlistService.removeItem(userId, productId);
    return ResponseEntity.noContent().build();
  }

  private Long currentUserId(Authentication authentication) {
    var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
    return wishlistService.resolveUserIdByEmail(principal.getUsername());
  }
}