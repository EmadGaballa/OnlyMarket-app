package com.platform.ecommerce.catalog.category;

import com.platform.ecommerce.catalog.category.domain.Category;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Category endpoints. Public reads; mutations are admin-only.
 */
@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categories")
public class CategoryController {

  private final CategoryService categoryService;

  public CategoryController(CategoryService categoryService) {
    this.categoryService = categoryService;
  }

  @GetMapping
  @Operation(summary = "List all top-level categories")
  public ResponseEntity<List<Category>> list() {
    return ResponseEntity.ok(categoryService.listTopLevel());
  }

  @GetMapping("/{slug}")
  @Operation(summary = "Get category by slug")
  public ResponseEntity<Category> get(@PathVariable String slug) {
    return ResponseEntity.ok(categoryService.getBySlug(slug));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('" + com.platform.ecommerce.user.Permissions.CATEGORY_MANAGE + "')")
  @Operation(summary = "Create a category (admin)")
  public ResponseEntity<Category> create(@RequestBody CategoryRequest request) {
    return ResponseEntity.ok(categoryService.create(request));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('" + com.platform.ecommerce.user.Permissions.CATEGORY_MANAGE + "')")
  @Operation(summary = "Update a category (admin)")
  public ResponseEntity<Category> update(@PathVariable Long id, @RequestBody CategoryRequest request) {
    return ResponseEntity.ok(categoryService.update(id, request));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('" + com.platform.ecommerce.user.Permissions.CATEGORY_MANAGE + "')")
  @Operation(summary = "Delete a category (admin)")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    categoryService.delete(id);
    return ResponseEntity.noContent().build();
  }
}