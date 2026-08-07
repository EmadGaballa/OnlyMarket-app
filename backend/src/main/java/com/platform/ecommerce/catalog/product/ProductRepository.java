package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.catalog.product.domain.Product;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** Data access for {@link Product} with search/filter/sort/pagination. */
public interface ProductRepository extends JpaRepository<Product, Long> {

  Optional<Product> findBySlug(String slug);

  Optional<Product> findByExternalId(Long externalId);

  boolean existsBySlug(String slug);

  boolean existsBySku(String sku);

  @Query("""
      SELECT p FROM Product p
      WHERE p.status = 'PUBLISHED'
        AND (CAST(:search AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
             OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        AND (:categoryId IS NULL OR p.category.id = :categoryId)
        AND (:brandId IS NULL OR p.brand.id = :brandId)
        AND (:minPrice IS NULL OR p.basePrice >= :minPrice)
        AND (:maxPrice IS NULL OR p.basePrice <= :maxPrice)
      """)
  Page<Product> searchPublished(
      @Param("search") String search,
      @Param("categoryId") Long categoryId,
      @Param("brandId") Long brandId,
      @Param("minPrice") java.math.BigDecimal minPrice,
      @Param("maxPrice") java.math.BigDecimal maxPrice,
      Pageable pageable);

  @Query("""
      SELECT p FROM Product p
      WHERE p.seller.id = :sellerId
        AND (:status IS NULL OR p.status = :status)
        AND (CAST(:search AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
      """)
  Page<Product> searchBySeller(
      @Param("sellerId") Long sellerId,
      @Param("status") Product.Status status,
      @Param("search") String search,
      Pageable pageable);

  @Query("""
      SELECT p FROM Product p
      WHERE (:status IS NULL OR p.status = :status)
        AND (CAST(:search AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
      """)
  Page<Product> searchAll(
      @Param("status") Product.Status status,
      @Param("search") String search,
      Pageable pageable);
}