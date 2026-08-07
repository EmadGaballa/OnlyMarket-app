package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.product.domain.Product;
import java.math.BigDecimal;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Data access for {@link Product} with search/filter/sort/pagination. */
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            SELECT DISTINCT p FROM Product p
            LEFT JOIN FETCH p.category
            LEFT JOIN FETCH p.brand
            WHERE p.slug = :slug
            """)
    Optional<Product> findBySlug(@Param("slug") String slug);

    Optional<Product> findByExternalId(Long externalId);

    boolean existsBySlug(String slug);

    boolean existsBySku(String sku);

    @Query("""
            SELECT p FROM Product p
            WHERE p.status = com.platform.ecommerce.catalog.product.domain.Product.Status.PUBLISHED
              AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:brandId IS NULL OR p.brand.id = :brandId)
              AND (:minPrice IS NULL OR p.basePrice >= :minPrice)
              AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)
            """)
    Page<Product> searchPublished(
            @Param("search") String search,
            @Param("categoryId") Long categoryId,
            @Param("brandId") Long brandId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.seller.id = :sellerId
              AND (:status IS NULL OR p.status = :status)
              AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> searchBySeller(
            @Param("sellerId") Long sellerId,
            @Param("status") Product.Status status,
            @Param("search") String search,
            Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE (:status IS NULL OR p.status = :status)
              AND (:search IS NULL OR :search = '' OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> searchAll(
            @Param("status") Product.Status status,
            @Param("search") String search,
            Pageable pageable);
}