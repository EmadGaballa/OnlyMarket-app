package com.platform.ecommerce.catalog.product;

import com.platform.ecommerce.user.Permissions;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin-only product import endpoints (Section 6).
 */
@RestController
@RequestMapping("/api/v1/admin/products")
@Tag(name = "Admin Products")
public class AdminProductController {

  private final ProductImportService productImportService;

  public AdminProductController(ProductImportService productImportService) {
    this.productImportService = productImportService;
  }

  @PostMapping("/import")
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_IMPORT + "')")
  @Operation(summary = "Start DummyJSON product import (background job)")
  public ResponseEntity<String> startImport() {
    String jobId = productImportService.startImport();
    return ResponseEntity.ok(jobId);
  }

  @GetMapping("/import/{jobId}/status")
  @PreAuthorize("hasAuthority('" + Permissions.PRODUCT_IMPORT + "')")
  @Operation(summary = "Poll import job status")
  public ResponseEntity<String> importStatus(@PathVariable String jobId) {
    String status = productImportService.getStatus(jobId);
    return ResponseEntity.ok(status != null ? status : "UNKNOWN");
  }
}