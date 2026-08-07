package com.platform.ecommerce.catalog.brand;

import com.platform.ecommerce.catalog.brand.domain.Brand;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Brand}. */
public interface BrandRepository extends JpaRepository<Brand, Long> {

  Optional<Brand> findByName(String name);

  Optional<Brand> findByExternalId(Long externalId);

  boolean existsByName(String name);
}