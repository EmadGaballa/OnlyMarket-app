package com.platform.ecommerce.favorite;

import com.platform.ecommerce.favorite.domain.Favorite;
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
 * Favorite endpoints. All operations are scoped to the authenticated user.
 */
@RestController
@RequestMapping("/api/v1/favorites")
@Tag(name = "Favorites")
public class FavoriteController {

  private final FavoriteService favoriteService;

  public FavoriteController(FavoriteService favoriteService) {
    this.favoriteService = favoriteService;
  }

  @GetMapping
  @Operation(summary = "Get current user's favorites")
  public ResponseEntity<List<Favorite>> getFavorites(Authentication authentication) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(favoriteService.listFavorites(userId));
  }

  @PostMapping("/{productId}")
  @Operation(summary = "Add product to favorites")
  public ResponseEntity<Favorite> addFavorite(
      Authentication authentication,
      @PathVariable Long productId) {
    Long userId = currentUserId(authentication);
    return ResponseEntity.ok(favoriteService.addFavorite(userId, productId));
  }

  @DeleteMapping("/{productId}")
  @Operation(summary = "Remove product from favorites")
  public ResponseEntity<Void> removeFavorite(
      Authentication authentication,
      @PathVariable Long productId) {
    Long userId = currentUserId(authentication);
    favoriteService.removeFavorite(userId, productId);
    return ResponseEntity.noContent().build();
  }

  private Long currentUserId(Authentication authentication) {
    var principal = (org.springframework.security.core.userdetails.User) authentication.getPrincipal();
    return favoriteService.resolveUserIdByEmail(principal.getUsername());
  }
}