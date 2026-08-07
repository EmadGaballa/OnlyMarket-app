package com.platform.ecommerce.catalog.product.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * Create/update product request payload. Separate from
 * {@link ProductResponse} — create/update have different validation and
 * field-visibility needs than the response.
 */
public record ProductRequest(
    @Schema(description = "Product name", example = "Wireless Headphones")
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    String name,

    @Schema(description = "Product description", example = "Premium noise-cancelling headphones")
    @NotBlank(message = "Description is required")
    String description,

    @Schema(description = "Base price", example = "199.99")
    @NotNull(message = "Base price is required")
    @DecimalMin(value = "0.0", message = "Base price must be non-negative")
    BigDecimal basePrice,

    @Schema(description = "Cost price (seller/admin only, never exposed to customers)", example = "120.00")
    @DecimalMin(value = "0.0", message = "Cost price must be non-negative")
    BigDecimal costPrice,

    @Schema(description = "Unique SKU", example = "WH-1000XM5")
    @NotBlank(message = "SKU is required")
    @Size(max = 100)
    String sku,

    @Schema(description = "Brand id", example = "1")
    Long brandId,

    @Schema(description = "Category id", example = "2")
    Long categoryId,

    @Schema(description = "Product status", example = "PUBLISHED")
    String status,

    @Schema(description = "Product variants (optional)")
    List<VariantRequest> variants) {

  public record VariantRequest(
      @Schema(description = "Variant SKU", example = "WH-1000XM5-BLUE-L")
      @NotBlank(message = "Variant SKU is required")
      @Size(max = 100)
      String sku,

      @Schema(description = "Variant price override (optional)", example = "219.99")
      @DecimalMin(value = "0.0")
      BigDecimal priceOverride,

      @Schema(description = "Attribute-value pairs as JSON", example = "{\"Color\":\"Blue\",\"Size\":\"L\"}")
      String attributesJson) {}
}