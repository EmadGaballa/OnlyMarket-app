package com.platform.ecommerce.catalog.category;

import com.platform.ecommerce.catalog.category.domain.Category;
import com.platform.ecommerce.common.exception.DuplicateResourceException;
import com.platform.ecommerce.common.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Category CRUD operations. */
@Service
public class CategoryService {

  private final CategoryRepository categoryRepository;

  public CategoryService(CategoryRepository categoryRepository) {
    this.categoryRepository = categoryRepository;
  }

  @Transactional(readOnly = true)
  public List<Category> listTopLevel() {
    return categoryRepository.findByParentIsNullOrderByNameAsc();
  }

  @Transactional(readOnly = true)
  public Category getBySlug(String slug) {
    return categoryRepository.findBySlug(slug)
        .orElseThrow(() -> new ResourceNotFoundException("Category with slug " + slug));
  }

  @Transactional
  public Category create(CategoryRequest request) {
    if (categoryRepository.existsBySlug(request.slug())) {
      throw new DuplicateResourceException("Category", "slug", request.slug());
    }
    Category category = new Category(request.name(), request.slug());
    if (request.parentId() != null) {
      Category parent = categoryRepository.findById(request.parentId())
          .orElseThrow(() -> new ResourceNotFoundException("Category", request.parentId()));
      category.setParent(parent);
    }
    return categoryRepository.save(category);
  }

  @Transactional
  public Category update(Long id, CategoryRequest request) {
    Category category = categoryRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    category.setName(request.name());
    if (request.parentId() != null) {
      Category parent = categoryRepository.findById(request.parentId())
          .orElseThrow(() -> new ResourceNotFoundException("Category", request.parentId()));
      category.setParent(parent);
    } else {
      category.setParent(null);
    }
    return categoryRepository.save(category);
  }

  @Transactional
  public void delete(Long id) {
    Category category = categoryRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Category", id));
    categoryRepository.delete(category);
  }
}