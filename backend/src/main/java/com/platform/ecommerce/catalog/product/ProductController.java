package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.product.dto.ReviewRequest;
import com.platform.ecommerce.catalog.product.dto.ReviewResponse;
import com.platform.ecommerce.catalog.product.domain.Product;
import com.platform.ecommerce.catalog.product.dto.ProductRequest;
import com.platform.ecommerce.catalog.product.dto.ProductResponse;
import com.platform.ecommerce.common.dto.PagedResponse;
import com.platform.ecommerce.user.Permissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Product endpoints. Public listing/detail are open; mutations are
 * permission-gated with ownership checks via {@code @productSecurity}.
 */
@RestController
@RequestMapping("/api/v1/products")
@Tag(name = "Products")
public class ProductController {

  private final ProductService productService;
  private final ProductImageService productImageService;

  public ProductController(ProductService productService, ProductImageService productImageService) {
    this.productService = productService;
    this.productImageService = productImageService;
  }

  @GetMapping
  @Operation(summary = "Search published products", description = "Public product listing with search/filter/sort/pagination.")
  public ResponseEntity<PagedResponse<ProductResponse>> search(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) Long categoryId,
      @RequestParam(required = false) Long brandId,
      @RequestParam(required = false) BigDecimal minPrice,
      @RequestParam(required = false) BigDecimal maxPrice,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String sort) {
    String normalizedSort = normalizeSort(sort);
    return ResponseEntity.ok(productService.searchPublished(
        search, categoryId, brandId, minPrice, maxPrice, page, size, normalizedSort));
  }

  @GetMapping("/{slug}")
  @Operation(summary = "Get product by slug")
  public ResponseEntity<ProductResponse> getBySlug(@PathVariable String slug) {
    return ResponseEntity.ok(productService.getBySlug(slug));
  }

  // =========================================================================
  // REVIEWS ENDPOINT (Serves review comments and ratings to the frontend)
  // =========================================================================

  @GetMapping("/{productId}/reviews")
  @Operation(summary = "Get reviews for a product", description = "Public endpoint to retrieve reviews for a specific product ID.")
  public ResponseEntity<List<ReviewResponse>> getProductReviews(@PathVariable Long productId) {
    return ResponseEntity.ok(productService.getReviews(productId));
  }

  @PostMapping("/{productId}/reviews")
  @Operation(summary = "Submit a review for a product")
  public ResponseEntity<ReviewResponse> submitReview(
      @PathVariable Long productId,
      @Valid @RequestBody ReviewRequest request,
      Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      throw new IllegalStateException("User authentication principal is missing or invalid");
    }
    String email = authentication.getName();
    return ResponseEntity.ok(productService.addReview(productId, email, request));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_CREATE + "')")
  @Operation(summary = "Create a product (seller or admin)")
  public ResponseEntity<ProductResponse> create(
      @Valid @RequestBody ProductRequest request,
      Authentication authentication) {
    Long sellerId = currentUserId(authentication);
    return ResponseEntity.ok(productService.create(sellerId, request));
  }

  @PutMapping("/{productId}/{slug}")
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_EDIT_ANY + "') or "
      + "(hasAuthority('" + Permissions.PRODUCT_EDIT_OWN + "') and "
      + "@productSecurity.isOwner(#productId, principal))")
  @Operation(summary = "Update a product (owner or admin)")
  public ResponseEntity<ProductResponse> update(
      @PathVariable Long productId,
      @PathVariable String slug,
      @Valid @RequestBody ProductRequest request) {
    return ResponseEntity.ok(productService.update(productId, slug, request));
  }

  @DeleteMapping("/{productId}/{slug}")
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_DELETE_ANY + "') or "
      + "(hasAuthority('" + Permissions.PRODUCT_DELETE_OWN + "') and "
      + "@productSecurity.isOwner(#productId, principal))")
  @Operation(summary = "Delete a product (owner or admin)")
  public ResponseEntity<Void> delete(@PathVariable Long productId, @PathVariable String slug) {
    productService.delete(productId, slug);
    return ResponseEntity.noContent().build();
  }

  @PostMapping("/{productId}/{slug}/images")
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_EDIT_ANY + "') or "
      + "(hasAuthority('" + Permissions.PRODUCT_EDIT_OWN + "') and "
      + "@productSecurity.isOwner(#productId, principal))")
  @Operation(summary = "Upload image for a product")
  public ResponseEntity<ProductResponse> uploadImage(
      @PathVariable Long productId,
      @PathVariable String slug,
      @RequestPart("file") MultipartFile file,
      @RequestParam(required = false) String altText) {

    String url = productImageService.storeImage(productId, file);
    return ResponseEntity.ok(productService.addImage(productId, slug, url, altText));
  }

  @GetMapping("/seller/mine")
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_EDIT_OWN + "')")
  @Operation(summary = "List current seller's products")
  public ResponseEntity<PagedResponse<ProductResponse>> myProducts(
      @RequestParam(required = false) Product.Status status,
      @RequestParam(required = false) String search,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size,
      @RequestParam(required = false) String sort,
      Authentication authentication) {
    Long sellerId = currentUserId(authentication);
    String normalizedSort = normalizeSort(sort);
    return ResponseEntity.ok(productService.searchBySeller(sellerId, status, search, page, size, normalizedSort));
  }

  private Long currentUserId(Authentication authentication) {
    if (authentication == null || authentication.getName() == null) {
      throw new IllegalStateException("User authentication principal is missing or invalid");
    }
    return productService.resolveUserIdByEmail(authentication.getName());
  }

  private String normalizeSort(String sort) {
    if (sort == null || sort.isBlank()) {
      return "createdAt,desc";
    }

    String normalized = sort.trim();
    String field;
    String direction = "asc";

    if (normalized.contains(",")) {
      String[] parts = normalized.split(",");
      field = parts[0].trim();
      if (parts.length > 1) {
        direction = parts[1].trim();
      }
    } else if (normalized.contains("_")) {
      int lastUnderscore = normalized.lastIndexOf('_');
      String possibleDir = normalized.substring(lastUnderscore + 1);
      if ("asc".equalsIgnoreCase(possibleDir) || "desc".equalsIgnoreCase(possibleDir)) {
        field = normalized.substring(0, lastUnderscore);
        direction = possibleDir;
      } else {
        field = normalized;
      }
    } else {
      field = normalized;
    }

    if ("price".equalsIgnoreCase(field)) {
      field = "basePrice";
    } else if ("newest".equalsIgnoreCase(field) || "date".equalsIgnoreCase(field)) {
      field = "createdAt";
    }

    return field + "," + direction.toLowerCase();
  }
}