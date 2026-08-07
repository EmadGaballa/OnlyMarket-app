package com.platform.ecommerce.catalog.variant;

import com.platform.ecommerce.catalog.variant.domain.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link ProductVariant}. */
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {

  List<ProductVariant> findByProductId(Long productId);

  Optional<ProductVariant> findBySku(String sku);

  boolean existsBySku(String sku);
}