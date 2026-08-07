package com.platform.ecommerce.catalog.brand;

import com.platform.ecommerce.catalog.brand.domain.Brand;
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
 * Brand endpoints. Public reads; mutations are admin-only.
 */
@RestController
@RequestMapping("/api/v1/brands")
@Tag(name = "Brands")
public class BrandController {

  private final BrandService brandService;

  public BrandController(BrandService brandService) {
    this.brandService = brandService;
  }

  @GetMapping
  @Operation(summary = "List all brands")
  public ResponseEntity<List<Brand>> list() {
    return ResponseEntity.ok(brandService.listAll());
  }

  @GetMapping("/{id}")
  @Operation(summary = "Get brand by id")
  public ResponseEntity<Brand> get(@PathVariable Long id) {
    return ResponseEntity.ok(brandService.getById(id));
  }

  @PostMapping
  @PreAuthorize("hasAuthority('" + com.platform.ecommerce.user.Permissions.CATEGORY_MANAGE + "')")
  @Operation(summary = "Create a brand (admin)")
  public ResponseEntity<Brand> create(@RequestBody BrandRequest request) {
    return ResponseEntity.ok(brandService.create(request));
  }

  @PutMapping("/{id}")
  @PreAuthorize("hasAuthority('" + com.platform.ecommerce.user.Permissions.CATEGORY_MANAGE + "')")
  @Operation(summary = "Update a brand (admin)")
  public ResponseEntity<Brand> update(@PathVariable Long id, @RequestBody BrandRequest request) {
    return ResponseEntity.ok(brandService.update(id, request));
  }

  @DeleteMapping("/{id}")
  @PreAuthorize("hasAuthority('" + com.platform.ecommerce.user.Permissions.CATEGORY_MANAGE + "')")
  @Operation(summary = "Delete a brand (admin)")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    brandService.delete(id);
    return ResponseEntity.noContent().build();
  }
}