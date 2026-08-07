package com.platform.ecommerce.catalog.category;

import com.platform.ecommerce.catalog.category.domain.Category;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Data access for {@link Category}. */
public interface CategoryRepository extends JpaRepository<Category, Long> {

  Optional<Category> findBySlug(String slug);

  Optional<Category> findByName(String name);

  boolean existsBySlug(String slug);

  List<Category> findByParentIsNullOrderByNameAsc();
}