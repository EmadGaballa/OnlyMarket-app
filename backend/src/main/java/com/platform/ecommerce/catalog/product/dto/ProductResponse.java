package com.platform.ecommerce.catalog.product.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Product response. The {@code costPrice} field is only populated for
 * seller/admin views — never for customer-facing responses (Section 8.3).
 */
public record ProductResponse(
    @Schema(description = "Product id")
    Long id,

    @Schema(description = "Product name", example = "Wireless Headphones")
    String name,

    @Schema(description = "URL-friendly slug", example = "wireless-headphones")
    String slug,

    @Schema(description = "Product description")
    String description,

    @Schema(description = "Base price", example = "199.99")
    BigDecimal basePrice,

    @Schema(description = "Cost price — seller/admin only, null for customers", example = "120.00")
    BigDecimal costPrice,

    @Schema(description = "Unique SKU", example = "WH-1000XM5")
    String sku,

    @Schema(description = "Product status", example = "PUBLISHED")
    String status,

    @Schema(description = "Brand id")
    Long brandId,

    @Schema(description = "Brand name", example = "Sony")
    String brandName,

    @Schema(description = "Category id")
    Long categoryId,

    @Schema(description = "Category name", example = "Electronics")
    String categoryName,

    @Schema(description = "Seller id (null for platform-owned/imported products)")
    Long sellerId,

    @Schema(description = "Average rating 0-5", example = "4.5")
    BigDecimal averageRating,

    @Schema(description = "Review count", example = "128")
    int reviewCount,

    @Schema(description = "Product images")
    List<ImageResponse> images,

    @Schema(description = "Product variants")
    List<VariantResponse> variants,

    @Schema(description = "Creation timestamp")
    Instant createdAt) {

  public record ImageResponse(
      Long id,
      String url,
      int displayOrder,
      String altText) {}

  public record VariantResponse(
      Long id,
      String sku,
      BigDecimal priceOverride,
      BigDecimal effectivePrice,
      String attributesJson) {}
}