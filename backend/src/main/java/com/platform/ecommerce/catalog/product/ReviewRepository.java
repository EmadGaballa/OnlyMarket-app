package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.product.domain.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByProduct_IdOrderByCreatedAtDesc(Long productId);
}