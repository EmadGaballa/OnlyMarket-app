package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.product.domain.Product;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * SpEL helper for {@code @PreAuthorize} ownership checks, e.g.
 * {@code @productSecurity.isOwner(#productId, principal)}.
 */
@Component("productSecurity")
public class ProductSecurity {

  private final ProductRepository productRepository;

  public ProductSecurity(ProductRepository productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * Returns true if the authenticated principal owns the product (or the
   * product is platform-owned with no seller).
   */
  public boolean isOwner(Long productId, Object principal) {
    if (productId == null || !(principal instanceof UserDetails userDetails)) {
      return false;
    }
    return productRepository.findById(productId)
        .map(product -> isOwner(product, userDetails))
        .orElse(false);
  }

  public boolean isOwner(Product product, UserDetails userDetails) {
    if (product.getSeller() == null) {
      // Platform-owned/imported products are managed by admins only.
      return false;
    }
    return product.getSeller().getEmail().equals(userDetails.getUsername());
  }
}