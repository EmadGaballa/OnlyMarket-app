package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.product.domain.ProductImage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link ProductImage}. */
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

  List<ProductImage> findByProductIdOrderByDisplayOrderAsc(Long productId);

  void deleteByProductId(Long productId);
}